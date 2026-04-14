package profile

import (
	"context"
	"fmt"
)

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) GetProfile(ctx context.Context, rut string) (Profile, error) {
	p, err := s.repo.FindByRUT(ctx, rut)
	if err != nil {
		return Profile{}, fmt.Errorf("profile.GetProfile: %w", err)
	}
	return p, nil
}
