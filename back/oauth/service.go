package oauth

import (
	"context"
	"fmt"
	"net/http"

	"github.com/google/uuid"
	"go-security/kit/web"
	"google.golang.org/api/idtoken"
)

type service struct {
	cfg Config
}

func NewService(cfg Config) Service {
	return &service{cfg: cfg}
}

func (s *service) GoogleLogin(ctx context.Context, token string) (User, error) {
	// Validar firma, expiración e issuer sin restringir audience aún.
	payload, err := idtoken.Validate(ctx, token, "")
	if err != nil {
		return User{}, web.NewRequestError(
			fmt.Errorf("token de Google inválido o expirado: %w", err),
			http.StatusUnauthorized,
		)
	}

	// Validar que el Audience (o azp) pertenezca a alguno de nuestros Client IDs.
	validAudience := false
	for _, clientID := range s.cfg.GoogleClientIDs {
		if payload.Audience == clientID {
			validAudience = true
			break
		}
		if azp, ok := payload.Claims["azp"].(string); ok && azp == clientID {
			validAudience = true
			break
		}
	}

	if !validAudience {
		return User{}, web.NewRequestError(
			fmt.Errorf("client ID no autorizado (audience: %s)", payload.Audience),
			http.StatusUnauthorized,
		)
	}

	email, _ := payload.Claims["email"].(string)
	name, _ := payload.Claims["name"].(string)

	return User{
		ID:    uuid.NewString(),
		Email: email,
		Name:  name,
	}, nil
}
