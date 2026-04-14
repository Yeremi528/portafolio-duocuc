package db

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var Client *mongo.Client

// DB es una referencia a la base de datos conectada.
type DB struct {
	client   *mongo.Client
	database string
}

// Connect establece la conexión a MongoDB y retorna un *DB listo para usar.
func Connect(URI string) (*DB, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	clientOptions := options.Client().ApplyURI(URI)

	var err error
	Client, err = mongo.Connect(ctx, clientOptions)
	if err != nil {
		return nil, fmt.Errorf("error conectando a MongoDB: %w", err)
	}

	if err := Client.Ping(ctx, nil); err != nil {
		return nil, fmt.Errorf("error al hacer ping a MongoDB: %w", err)
	}

	return &DB{client: Client, database: "security"}, nil
}

// Collection retorna la colección especificada.
func (d *DB) Collection(name string) *mongo.Collection {
	return d.client.Database(d.database).Collection(name)
}

// ConnectMongo mantiene compatibilidad con el código existente.
// Deprecated: usa Connect() y DB.Collection() directamente.
func ConnectMongo(URI string) (*mongo.Collection, error) {
	d, err := Connect(URI)
	if err != nil {
		return nil, err
	}
	return d.Collection("customer"), nil
}

func CloseMongo() {
	if Client != nil {
		if err := Client.Disconnect(context.Background()); err != nil {
			fmt.Printf("Error cerrando MongoDB: %v\n", err)
		}
	}
}
