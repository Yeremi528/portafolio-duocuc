package profile

import "context"

// Service define las operaciones del módulo de perfil.
type Service interface {
	GetProfile(ctx context.Context, rut string) (Profile, error)
}

// Repository define las operaciones de persistencia para la colección `Perfil`.
type Repository interface {
	FindByRUT(ctx context.Context, rut string) (Profile, error)
}
