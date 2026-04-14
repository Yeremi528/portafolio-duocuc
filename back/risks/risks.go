package risks

import "context"

// Service define las operaciones del módulo de peligros/estadísticas.
type Service interface {
	GetStats(ctx context.Context, commune string) (Stats, error)
}

// Repository define las operaciones de persistencia para la colección `peligros`.
type Repository interface {
	FindByCommune(ctx context.Context, commune string) ([]Peligro, error)
}
