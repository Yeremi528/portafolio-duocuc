package profile

import (
	"encoding/json"
	"net/http"

	"go-security/kit/web"
)

// Profile representa el documento de la colección `Perfil` en MongoDB.
type Profile struct {
	RUT       string `json:"rut"       bson:"rut"`
	Nombre    string `json:"nombre"    bson:"nombre"`
	Email     string `json:"email"     bson:"email"`
	Telefono  string `json:"telefono"  bson:"telefono"`
	Direccion string `json:"direccion" bson:"direccion"`
	Comuna    string `json:"comuna"    bson:"comuna"`
	Region    string `json:"region"    bson:"region"`
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
