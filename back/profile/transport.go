package profile

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"go-security/kit/tracer"
)

type HttpHandler struct {
	svc Service
}

func MakeHandlerWith(svc Service) *HttpHandler {
	return &HttpHandler{svc: svc}
}

func (h *HttpHandler) SetRoutesTo(r chi.Router) {
	r.Get("/api/v1/profile", h.getProfile)
}

// GET /api/v1/profile
// El RUT viene del contexto inyectado por el middleware de autenticación.
func (h *HttpHandler) getProfile(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	v := tracer.GetValues(r.Context())

	p, err := h.svc.GetProfile(r.Context(), v.Rut)
	if err != nil {
		body, status := newErrorResponse(err)
		w.WriteHeader(status)
		w.Write(body)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(p)
}
