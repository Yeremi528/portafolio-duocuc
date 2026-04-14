package mids

import (
	"net/http"

	"go-security/kit/tracer"
)

func TraceID(next http.Handler) http.Handler {
	h := func(w http.ResponseWriter, r *http.Request) {
		ctx := tracer.NewTraceID(r)

		next.ServeHTTP(w, r.WithContext(ctx))
	}

	return http.HandlerFunc(h)
}
