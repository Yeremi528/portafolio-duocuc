package risks

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
	r.Get("/api/v1/risks/stats", h.getStats)
}

// GET /api/v1/risks/stats?commune=Maipú
func (h *HttpHandler) getStats(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	commune := r.URL.Query().Get("commune")

	stats, err := h.svc.GetStats(r.Context(), commune)
	if err != nil {
		body, status := newErrorResponse(err)
		w.WriteHeader(status)
		w.Write(body)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(stats)
}
