package consultationdb

import (
	"context"
	"fmt"
	"net/http"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go-security/consultation"
	"go-security/kit/web"
)

type Repository struct {
	collection *mongo.Collection
}

func NewRepository(collection *mongo.Collection) *Repository {
	return &Repository{collection: collection}
}

func (r *Repository) Save(ctx context.Context, c consultation.Consulta) error {
	_, err := r.collection.InsertOne(ctx, c)
	if err != nil {
		return fmt.Errorf("consultationdb.Save: %w", err)
	}
	return nil
}

func (r *Repository) FindByRUT(ctx context.Context, rut string) ([]consultation.Consulta, error) {
	filter := bson.M{"rut": rut}
	opts := options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}})

	cursor, err := r.collection.Find(ctx, filter, opts)
	if err != nil {
		return nil, fmt.Errorf("consultationdb.FindByRUT: %w", err)
	}
	defer cursor.Close(ctx)

	var consultas []consultation.Consulta
	if err := cursor.All(ctx, &consultas); err != nil {
		return nil, fmt.Errorf("consultationdb.FindByRUT: decode: %w", err)
	}
	return consultas, nil
}

func (r *Repository) FindByID(ctx context.Context, id string) (consultation.Consulta, error) {
	filter := bson.M{"_id": id}

	var c consultation.Consulta
	err := r.collection.FindOne(ctx, filter).Decode(&c)
	if err == mongo.ErrNoDocuments {
		return consultation.Consulta{}, web.NewRequestError(
			fmt.Errorf("consulta no encontrada"),
			http.StatusNotFound,
		)
	}
	if err != nil {
		return consultation.Consulta{}, fmt.Errorf("consultationdb.FindByID: %w", err)
	}
	return c, nil
}
