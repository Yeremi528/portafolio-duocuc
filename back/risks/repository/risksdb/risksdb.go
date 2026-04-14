package risksdb

import (
	"context"
	"fmt"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go-security/risks"
)

type Repository struct {
	collection *mongo.Collection
}

func NewRepository(collection *mongo.Collection) *Repository {
	return &Repository{collection: collection}
}

func (r *Repository) FindByCommune(ctx context.Context, commune string) ([]risks.Peligro, error) {
	filter := bson.M{"commune": commune}

	cursor, err := r.collection.Find(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("risksdb.FindByCommune: %w", err)
	}
	defer cursor.Close(ctx)

	var peligros []risks.Peligro
	if err := cursor.All(ctx, &peligros); err != nil {
		return nil, fmt.Errorf("risksdb.FindByCommune: decode: %w", err)
	}
	return peligros, nil
}
