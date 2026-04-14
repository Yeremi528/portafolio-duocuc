package oauth

import (
	"encoding/json"
	"net/http"

	"go-security/kit/web"
)

// Config almacena los Client IDs de Google permitidos (Web, Android, iOS).
type Config struct {
	GoogleClientIDs []string
}

// User representa el usuario autenticado vía OAuth.
type User struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name"`
}

// ErrorResponse es la estructura de error estándar del módulo OAuth.
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
