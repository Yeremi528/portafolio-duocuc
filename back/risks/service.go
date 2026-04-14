package risks

import (
	"context"
	"fmt"
	"net/http"

	"go-security/kit/web"
)

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) GetStats(ctx context.Context, commune string) (Stats, error) {
	if commune == "" {
		return Stats{}, web.NewRequestError(
			fmt.Errorf("parámetro 'commune' es requerido"),
			http.StatusBadRequest,
		)
	}

	peligros, err := s.repo.FindByCommune(ctx, commune)
	if err != nil {
		return Stats{}, fmt.Errorf("risks.GetStats: %w", err)
	}

	summaries := make([]RiskSummary, len(peligros))
	for i, p := range peligros {
		summaries[i] = RiskSummary{
			TipoDelito:   p.TipoDelito,
			Probabilidad: p.Probabilidad,
			Descripcion:  p.Descripcion,
		}
	}

	return Stats{
		Commune: commune,
		Risks:   summaries,
	}, nil
}
