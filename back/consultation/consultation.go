package consultation

import (
	"context"

	"go-security/kit/gemini"
)

// Service define las operaciones de negocio del módulo de consultas de seguridad.
type Service interface {
	Analyze(ctx context.Context, rut string, req AnalyzeRequest) (gemini.SecurityAnalysis, error)
	ListByRUT(ctx context.Context, rut string) ([]ConsultaSummary, error)
	GetByID(ctx context.Context, id string) (Consulta, error)
}

// Repository define las operaciones de persistencia.
type Repository interface {
	Save(ctx context.Context, c Consulta) error
	FindByRUT(ctx context.Context, rut string) ([]Consulta, error)
	FindByID(ctx context.Context, id string) (Consulta, error)
}

// StorageClient abstrae el acceso al bucket privado de imágenes.
type StorageClient interface {
	DownloadFile(ctx context.Context, imagePath string) ([]byte, error)
}

// AIClient abstrae las llamadas al modelo multimodal de IA.
// Recibe el optionID (1-4) y selecciona el prompt adecuado internamente.
type AIClient interface {
	Analyze(ctx context.Context, optionID int, imageData []byte, budget *float64) (gemini.SecurityAnalysis, error)
}
