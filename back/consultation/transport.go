package consultation

import (
	"encoding/json"
	"io"
	"net/http"

	"github.com/go-chi/chi/v5"
	"go-security/kit/tracer"
	"go-security/kit/web"
)

type HttpHandler struct {
	svc Service
}

func MakeHandlerWith(svc Service) *HttpHandler {
	return &HttpHandler{svc: svc}
}

const contentTypeJSON = "application/json"

func (h *HttpHandler) SetRoutesTo(r chi.Router) {
	r.Post("/api/v1/consultations/upload", h.upload)
	r.Post("/api/v1/consultations/analyze", h.analyze)
	r.Get("/api/v1/consultations", h.list)
	r.Get("/api/v1/consultations/{id}", h.getByID)
}

// POST /api/v1/consultations/upload
func (h *HttpHandler) upload(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", contentTypeJSON)

	v := tracer.GetValues(r.Context())

	r.Body = http.MaxBytesReader(w, r.Body, 10<<20)
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		body, status := newErrorResponse(web.NewRequestError(err, http.StatusBadRequest))
		w.WriteHeader(status)
		w.Write(body)
		return
	}

	file, _, err := r.FormFile("image")
	if err != nil {
		body, status := newErrorResponse(web.NewRequestError(err, http.StatusBadRequest))
		w.WriteHeader(status)
		w.Write(body)
		return
	}
	defer file.Close()

	imageData, err := io.ReadAll(file)
	if err != nil {
		body, status := newErrorResponse(err)
		w.WriteHeader(status)
		w.Write(body)
		return
	}

	path, err := h.svc.Upload(r.Context(), v.Rut, imageData)
	if err != nil {
		body, status := newErrorResponse(err)
		w.WriteHeader(status)
		w.Write(body)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"image_path": path})
}

// POST /api/v1/consultations/analyze
func (h *HttpHandler) analyze(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", contentTypeJSON)

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
	w.Header().Set("Content-Type", contentTypeJSON)

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
	w.Header().Set("Content-Type", contentTypeJSON)

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
