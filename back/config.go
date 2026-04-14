package main

import (
	"context"
	"time"

	"go-security/kit/secretmanager"
	"gopkg.in/yaml.v3"
	"os"
)

// Config agrupa toda la configuración del servicio.
type Config struct {
	Web            WebConfig   `yaml:"API"`
	Debug          DebugConfig `yaml:"DEBUG"`
	MongoURI       string      `yaml:"MONGODB_URI"`
	GeminiAPIKey   string      `yaml:"GEMINI_API_KEY"`
	GCPCredentials string      `yaml:"GCP_CREDENTIALS"`
	BucketName       string      `yaml:"BUCKET_NAME"`
	JWTSecret        string      `yaml:"JWT_SECRET"`
	GoogleClientIDs  []string    `yaml:"GOOGLE_CLIENT_IDS"`
}

type WebConfig struct {
	Host            string        `yaml:"HOST"`
	ReadTimeout     time.Duration `yaml:"READ_TIMEOUT"`
	IdleTimeout     time.Duration `yaml:"IDLE_TIMEOUT"`
	WriteTimeout    time.Duration `yaml:"WRITE_TIMEOUT"`
	ShutdownTimeout time.Duration `yaml:"SHUTDOWN_TIMEOUT"`
}

type DebugConfig struct {
	Host            string        `yaml:"HOST"`
	ReadTimeout     time.Duration `yaml:"READ_TIMEOUT"`
	IdleTimeout     time.Duration `yaml:"IDLE_TIMEOUT"`
	WriteTimeout    time.Duration `yaml:"WRITE_TIMEOUT"`
	ShutdownTimeout time.Duration `yaml:"SHUTDOWN_TIMEOUT"`
}

// loadLocalConfig lee config.yaml desde el directorio de trabajo.
// Debe llamarse antes de inicializar cualquier cliente GCP en entorno local.
func loadLocalConfig() (Config, error) {
	data, err := os.ReadFile("config.yaml")
	if err != nil {
		return Config{}, err
	}
	return parseConfig(data)
}

// loadRemoteConfig obtiene el config desde Secret Manager (entorno producción).
func loadRemoteConfig(ctx context.Context, sm *secretmanager.Client) (Config, error) {
	data, err := sm.GetSecret(ctx, "session")
	if err != nil {
		return Config{}, err
	}
	return parseConfig(data)
}

func parseConfig(data []byte) (Config, error) {
	var cfg Config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return Config{}, err
	}
	return cfg, nil
}
