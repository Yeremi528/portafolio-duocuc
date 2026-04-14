package consultation

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
	r.Post("/api/v1/consultations/analyze", h.analyze)
	r.Get("/api/v1/consultations", h.list)
	r.Get("/api/v1/consultations/{id}", h.getByID)
}

// POST /api/v1/consultations/analyze
func (h *HttpHandler) analyze(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	v := tracer.GetValues(r.Context())

	var req AnalyzeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		body, status := newErrorResponse(err)
		w.WriteHeader(status)
		w.Write(body)
		return
	}

	result, err := h.svc.Analyze(r.Context(), v.Rut, req)
	if err != nil {
		body, status := newErrorResponse(err)
		w.WriteHeader(status)
		w.Write(body)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(result)
}

// GET /api/v1/consultations
func (h *HttpHandler) list(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	v := tracer.GetValues(r.Context())

	summaries, err := h.svc.ListByRUT(r.Context(), v.Rut)
	if err != nil {
		body, status := newErrorResponse(err)
		w.WriteHeader(status)
		w.Write(body)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(summaries)
}

// GET /api/v1/consultations/{id}
func (h *HttpHandler) getByID(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	id := chi.URLParam(r, "id")

	consulta, err := h.svc.GetByID(r.Context(), id)
	if err != nil {
		body, status := newErrorResponse(err)
		w.WriteHeader(status)
		w.Write(body)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(consulta)
}
