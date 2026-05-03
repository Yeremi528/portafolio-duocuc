package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"runtime"
	"strings"
	"syscall"

	"go-security/consultation"
	consultationdb "go-security/consultation/repository/consultationdb"
	kclaude "go-security/kit/claude"
	kgemini "go-security/kit/gemini"
	"go-security/kit/logger"
	db "go-security/kit/mongo"
	"go-security/kit/secretmanager"
	kstorage "go-security/kit/storage"
	"go-security/kit/tracer"
	"go-security/kit/web/mids"
	"go-security/oauth"
	"go-security/profile"
	profiledb "go-security/profile/repository/profiledb"
	"go-security/risks"
	risksdb "go-security/risks/repository/risksdb"

	"github.com/go-chi/chi/v5"
)

var build = "dev"

func main() {
	var (
		ctx     = context.Background()
		writeTo = os.Stdout
		service = ""
		level   = logger.LevelInfo
	)

	log := logger.New(writeTo, level, service, traceFunc)
	log.Info(ctx, "Startup - Service Details", "logLevel", log.GetLevel().ToString(), "build", build, "cores", runtime.GOMAXPROCS(0))

	if err := run(ctx, log); err != nil {
		log.Error(ctx, "service error, shutting down", "errorDetails", err.Error())
		os.Exit(1)
	}
}

func run(ctx context.Context, log *logger.Logger) error {

	var (
		cfg Config
		err error
	)

	if os.Getenv("ENV") == "local" {
		cfg, err = loadLocalConfig()
		if err != nil {
			return fmt.Errorf("run: error cargando config local: %w", err)
		}
	} else {
		sm, err := secretmanager.New(ctx, secretmanager.Config{
			ProjectID: os.Getenv("PROJECT_ID"),
		})
		if err != nil {
			return fmt.Errorf("run: error inicializando secret manager: %w", err)
		}
		cfg, err = loadRemoteConfig(ctx, sm)
		if err != nil {
			return fmt.Errorf("run: error cargando config remoto: %w", err)
		}
	}

	// -----------------------------------------------------------------------
	// Base de datos

	database, err := db.Connect(cfg.MongoURI)
	if err != nil {
		return err
	}
	defer db.CloseMongo()

	// -----------------------------------------------------------------------
	// Repositorios

	var (
		consultationRepo = consultationdb.NewRepository(database.Collection("consultas"))
		risksRepo        = risksdb.NewRepository(database.Collection("peligros"))
		profileRepo      = profiledb.NewRepository(database.Collection("Perfil"))
	)

	// -----------------------------------------------------------------------
	// Clientes externos

	type storageCloser interface {
		consultation.StorageClient
		Close() error
	}

	var storageClient storageCloser
	if strings.EqualFold(os.Getenv("ENV"), "local") || strings.EqualFold(os.Getenv("env"), "local") {
		storageClient, err = kstorage.NewLocal("./tmp/bucket")
		if err != nil {
			return fmt.Errorf("run: error inicializando almacenamiento local: %w", err)
		}
		log.Info(ctx, "Usando almacenamiento LOCAL (./tmp/bucket)")
	} else {
		storageClient, err = kstorage.New(ctx, cfg.BucketName, cfg.GCPCredentials)
		if err != nil {
			return fmt.Errorf("run: error inicializando cliente GCS: %w", err)
		}
	}
	defer storageClient.Close()

	var aiClient consultation.AIClient
	if strings.EqualFold(cfg.AIProvider, "claude") {
		aiClient = kclaude.NewClient(cfg.ClaudeAPIKey, cfg.ClaudeModel)
		log.Info(ctx, "Usando proveedor de IA: Claude", "model", cfg.ClaudeModel)
	} else {
		aiClient = kgemini.NewClient(cfg.GeminiAPIKey, cfg.GeminiModel)
		log.Info(ctx, "Usando proveedor de IA: Gemini", "model", cfg.GeminiModel)
	}

	// -----------------------------------------------------------------------
	// Servicios

	var (
		consultationService = consultation.NewService(consultationRepo, storageClient, aiClient)
		risksService        = risks.NewService(risksRepo)
		profileService      = profile.NewService(profileRepo)
		oauthService        = oauth.NewService(oauth.Config{
			GoogleClientIDs: cfg.GoogleClientIDs,
		})
	)

	// -----------------------------------------------------------------------
	// Router y rutas

	router := chi.NewRouter()

	router.Use(mids.Cors(log))
	router.Use(mids.TraceID)
	router.Use(mids.Logging(log))
	router.Use(mids.Recoverer(log))
	router.Use(mids.ErrorRecoveryMiddleware)

	// Health check
	router.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok","service":"go-security"}`))
	})
	router.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	})

	// Rutas públicas (sin JWT)
	oauth.MakeHandlerWith(oauthService).SetRoutesTo(router)

	// Rutas protegidas (requieren JWT + X-RUT)
	router.Group(func(r chi.Router) {
		r.Use(mids.Authenticate)
		consultation.MakeHandlerWith(consultationService).SetRoutesTo(r)
		risks.MakeHandlerWith(risksService).SetRoutesTo(r)
		profile.MakeHandlerWith(profileService).SetRoutesTo(r)
	})

	// -----------------------------------------------------------------------
	// Servidor HTTP

	var (
		shutdownListener = make(chan os.Signal, 1)
		errListener      = make(chan error, 1)
	)

	signal.Notify(shutdownListener, syscall.SIGINT, syscall.SIGTERM)

	api := http.Server{
		Addr:         cfg.Web.Host,
		ReadTimeout:  cfg.Web.ReadTimeout,
		WriteTimeout: cfg.Web.WriteTimeout,
		IdleTimeout:  cfg.Web.IdleTimeout,
		Handler:      router,
	}

	go func() {
		log.Info(ctx, "Startup - API router started", "host", api.Addr)
		errListener <- api.ListenAndServe()
	}()

	// -----------------------------------------------------------------------
	// Graceful shutdown

	select {
	case err := <-errListener:
		return fmt.Errorf("server error: %w", err)

	case sig := <-shutdownListener:
		log.Info(ctx, "shutdown", "status", "shutdown started", "signal", sig)
		defer log.Info(ctx, "shutdown", "status", "shutdown completed", "signal", sig)

		ctx, cancel := context.WithTimeout(ctx, cfg.Web.ShutdownTimeout)
		defer cancel()

		if err := api.Shutdown(ctx); err != nil {
			api.Close()
			return fmt.Errorf("cannot stop server gracefully: %w", err)
		}
	}

	return nil
}

func traceFunc(ctx context.Context) []any {
	v := tracer.GetValues(ctx)

	fields := make([]any, 2, 4)
	fields[0], fields[1] = "traceID", v.TraceID

	if v.Rut != "" {
		fields = append(fields, "RUT", v.Rut)
	}

	return fields
}
