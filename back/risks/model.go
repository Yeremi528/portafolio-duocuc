package risks

import (
	"encoding/json"
	"net/http"

	"go-security/kit/web"
)

// Peligro representa un documento de la colección `peligros` en MongoDB.
type Peligro struct {
	Commune         string  `json:"commune"          bson:"commune"`
	TipoDelito      string  `json:"tipo_delito"      bson:"tipo_delito"`
	Probabilidad    float64 `json:"probabilidad"     bson:"probabilidad"`
	Descripcion     string  `json:"descripcion"      bson:"descripcion"`
}

// Stats es el JSON de respuesta con estadísticas pre-calculadas por comuna.
type Stats struct {
	Commune string        `json:"commune"`
	Risks   []RiskSummary `json:"risks"`
}

// RiskSummary agrupa un tipo de delito con su probabilidad y descripción.
type RiskSummary struct {
	TipoDelito   string  `json:"tipo_delito"`
	Probabilidad float64 `json:"probabilidad"`
	Descripcion  string  `json:"descripcion"`
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
