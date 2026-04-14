package mids

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"go-security/kit/tracer"
)

// authErrorResponse es la respuesta de error para fallos de autenticación.
type authErrorResponse struct {
	Error string `json:"error"`
}

func writeAuthError(w http.ResponseWriter, msg string, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	body, _ := json.Marshal(authErrorResponse{Error: msg})
	w.Write(body)
}

// Authenticate es el middleware global de autenticación.
// Valida el JWT desde el header Authorization (Bearer <token>)
// y extrae el RUT desde el header X-RUT, inyectándolos en el contexto.
//
// En entorno local (env=local) la validación JWT se omite: solo se requiere
// el header X-RUT para identificar al usuario durante el desarrollo.
func Authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		// --- Modo local: saltar validación JWT ---
		if os.Getenv("env") == "local" {
			rut := r.Header.Get("X-RUT")
			if rut == "" {
				rut = "00000000-0" // RUT de prueba por defecto
			}
			ctx := tracer.SetRUT(r.Context(), rut)
			next.ServeHTTP(w, r.WithContext(ctx))
			return
		}

		// --- 1. Extraer y validar JWT ---
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			writeAuthError(w, "Authorization header requerido", http.StatusUnauthorized)
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			writeAuthError(w, "formato de Authorization inválido (use: Bearer <token>)", http.StatusUnauthorized)
			return
		}
		tokenString := parts[1]

		jwtSecret := os.Getenv("JWT_SECRET")
		if jwtSecret == "" {
			jwtSecret = "changeme-secret-key"
		}

		token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("método de firma inesperado: %v", t.Header["alg"])
			}
			return []byte(jwtSecret), nil
		})
		if err != nil || !token.Valid {
			writeAuthError(w, "token JWT inválido o expirado", http.StatusUnauthorized)
			return
		}

		// --- 2. Extraer RUT desde header ---
		rut := r.Header.Get("X-RUT")
		if rut == "" {
			writeAuthError(w, "header X-RUT requerido", http.StatusBadRequest)
			return
		}

		// --- 3. Inyectar RUT en el contexto ---
		ctx := tracer.SetRUT(r.Context(), rut)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
