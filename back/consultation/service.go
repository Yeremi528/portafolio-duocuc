package consultation

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/google/uuid"
	"go-security/kit/gemini"
	"go-security/kit/web"
)

type service struct {
	repo    Repository
	storage StorageClient
	ai      AIClient
}

func NewService(repo Repository, storage StorageClient, ai AIClient) Service {
	return &service{repo: repo, storage: storage, ai: ai}
}

func (s *service) Analyze(ctx context.Context, rut string, req AnalyzeRequest) (gemini.SecurityAnalysis, error) {
	if req.ImagePath == "" {
		return gemini.SecurityAnalysis{}, web.NewRequestError(fmt.Errorf("image_path es requerido"), http.StatusBadRequest)
	}
	if req.OptionID < 1 || req.OptionID > 4 {
		return gemini.SecurityAnalysis{}, web.NewRequestError(fmt.Errorf("option_id debe ser entre 1 y 4"), http.StatusBadRequest)
	}

	// 1. Descargar imagen del bucket privado
	imageData, err := s.storage.DownloadFile(ctx, req.ImagePath)
	if err != nil {
		return gemini.SecurityAnalysis{}, fmt.Errorf("consultation.Analyze: error descargando imagen: %w", err)
	}

	// 2. Llamar a Gemini con el optionID (el cliente selecciona el prompt internamente)
	aiResult, err := s.ai.Analyze(ctx, req.OptionID, imageData, req.Budget)
	if err != nil {
		return gemini.SecurityAnalysis{}, fmt.Errorf("consultation.Analyze: error llamando a la IA: %w", err)
	}

	// 3. Persistir en MongoDB
	inputJSON, _ := json.Marshal(req)
	consulta := Consulta{
		ID:           uuid.NewString(),
		RUT:          rut,
		OptionID:     req.OptionID,
		ImagePath:    req.ImagePath,
		InputPayload: inputJSON,
		AIResult:     aiResult,
		CreatedAt:    time.Now().UTC(),
	}
	if err := s.repo.Save(ctx, consulta); err != nil {
		return gemini.SecurityAnalysis{}, fmt.Errorf("consultation.Analyze: error guardando consulta: %w", err)
	}

	return aiResult, nil
}

func (s *service) ListByRUT(ctx context.Context, rut string) ([]ConsultaSummary, error) {
	consultas, err := s.repo.FindByRUT(ctx, rut)
	if err != nil {
		return nil, fmt.Errorf("consultation.ListByRUT: %w", err)
	}

	summaries := make([]ConsultaSummary, len(consultas))
	for i, c := range consultas {
		summaries[i] = ConsultaSummary{
			ID:          c.ID,
			OptionID:    c.OptionID,
			ImagePath:   c.ImagePath,
			OverallRisk: c.AIResult.OverallRisk,
			Summary:     c.AIResult.Summary,
			CreatedAt:   c.CreatedAt,
		}
	}
	return summaries, nil
}

func (s *service) GetByID(ctx context.Context, id string) (Consulta, error) {
	c, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return Consulta{}, fmt.Errorf("consultation.GetByID: %w", err)
	}
	if c.ID == "" {
		return Consulta{}, web.NewRequestError(fmt.Errorf("consulta no encontrada"), http.StatusNotFound)
	}
	return c, nil
}
