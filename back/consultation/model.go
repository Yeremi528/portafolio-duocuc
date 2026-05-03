package consultation

import (
	"encoding/json"
	"net/http"
	"time"

	"go-security/kit/gemini"
	"go-security/kit/web"
)

// AnalyzeRequest es el cuerpo JSON recibido por POST /api/v1/consultations/analyze.
type AnalyzeRequest struct {
	ImagePath string   `json:"image_path"`
	OptionID  int      `json:"option_id"`
	Budget    *float64 `json:"budget"` // nil = ilimitado
}

// Consulta representa un documento guardado en la colección `consultas` de MongoDB.
type Consulta struct {
	ID           string                 `json:"id"            bson:"_id,omitempty"`
	RUT          string                 `json:"rut"           bson:"rut"`
	OptionID     int                    `json:"option_id"     bson:"option_id"`
	ImagePath    string                 `json:"image_path"    bson:"image_path"`
	InputPayload json.RawMessage        `json:"input_payload" bson:"input_payload"`
	AIResult     gemini.SecurityAnalysis `json:"ai_result"     bson:"ai_result"`
	CreatedAt    time.Time              `json:"created_at"    bson:"created_at"`
}

// ConsultaSummary es la vista completa para el listado de historial.
type ConsultaSummary struct {
	ID                   string                        `json:"id"`
	OptionID             int                           `json:"option_id"`
	ImagePath            string                        `json:"image_path"`
	OverallRisk          string                        `json:"overall_risk"`
	Summary              string                        `json:"summary"`
	Vulnerabilities      []gemini.Vulnerability        `json:"vulnerabilities,omitempty"`
	Recommendations      []gemini.Recommendation       `json:"recommendations,omitempty"`
	InsuranceSuggestions []gemini.InsuranceSuggestion  `json:"insurance_suggestions,omitempty"`
	EstimatedCost        *gemini.CostEstimate          `json:"estimated_cost,omitempty"`
	Priority             string                        `json:"priority"`
	CreatedAt            time.Time                     `json:"created_at"`
}

// ErrorResponse es la estructura de error estándar del módulo.
type ErrorResponse struct {
	ErrorMessage string `json:"error"`
}

func newErrorResponse(err error) ([]byte, int) {
	var status int
	switch {
	case web.IsRequestError(err):
		status = web.GetRequestError(err).Status
	default:
		status = http.StatusInternalServerError
	}

	body, _ := json.Marshal(ErrorResponse{ErrorMessage: err.Error()})
	return body, status
}
