package oauth

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

type HttpHandler struct {
	svc Service
}

func MakeHandlerWith(svc Service) *HttpHandler {
	return &HttpHandler{svc: svc}
}

func (h *HttpHandler) SetRoutesTo(r chi.Router) {
	r.Post("/oauth/google/login", h.googleLogin)
}

// POST /oauth/google/login
// Header: Authorization: <google-id-token>
func (h *HttpHandler) googleLogin(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	token := r.Header.Get("Authorization")
	if token == "" {
		body, status := newErrorResponse(http.ErrNoCookie)
		w.WriteHeader(status)
		w.Write(body)
		return
	}

	user, err := h.svc.GoogleLogin(r.Context(), token)
	if err != nil {
		body, status := newErrorResponse(err)
		w.WriteHeader(status)
		w.Write(body)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(user)
}
