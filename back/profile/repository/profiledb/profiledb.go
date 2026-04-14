package profiledb

import (
	"context"
	"fmt"
	"net/http"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go-security/kit/web"
	"go-security/profile"
)

type Repository struct {
	collection *mongo.Collection
}

func NewRepository(collection *mongo.Collection) *Repository {
	return &Repository{collection: collection}
}

func (r *Repository) FindByRUT(ctx context.Context, rut string) (profile.Profile, error) {
	filter := bson.M{"rut": rut}

	var p profile.Profile
	err := r.collection.FindOne(ctx, filter).Decode(&p)
	if err == mongo.ErrNoDocuments {
		return profile.Profile{}, web.NewRequestError(
			fmt.Errorf("perfil no encontrado para RUT: %s", rut),
			http.StatusNotFound,
		)
	}
	if err != nil {
		return profile.Profile{}, fmt.Errorf("profiledb.FindByRUT: %w", err)
	}
	return p, nil
}
