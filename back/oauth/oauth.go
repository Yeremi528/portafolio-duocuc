package oauth

import "context"

// Service define la interfaz de autenticación OAuth.
type Service interface {
	GoogleLogin(ctx context.Context, token string) (User, error)
}
