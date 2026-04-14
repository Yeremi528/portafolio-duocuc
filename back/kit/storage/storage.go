package storage

import (
	"context"
	"fmt"
	"io"

	"cloud.google.com/go/storage"
	"google.golang.org/api/option"
	"os"
)

// Client implementa consultation.StorageClient usando Google Cloud Storage.
type Client struct {
	bucket string
	gcs    *storage.Client
}

// New crea un cliente GCS.
//
// Local: pasa la ruta al JSON de la cuenta de servicio en credentialsFile.
// Cloud Run: deja credentialsFile vacío o inexistente — el SDK usa Application
// Default Credentials (ADC) del service account del servicio automáticamente.
func New(ctx context.Context, bucket, credentialsFile string) (*Client, error) {
	var opts []option.ClientOption
	if credentialsFile != "" {
		if _, err := os.Stat(credentialsFile); err == nil {
			opts = append(opts, option.WithCredentialsFile(credentialsFile))
		}
		// Si el archivo no existe se usa ADC (comportamiento de Cloud Run)
	}

	gcsClient, err := storage.NewClient(ctx, opts...)
	if err != nil {
		return nil, fmt.Errorf("storage.New: error creando cliente GCS: %w", err)
	}

	return &Client{bucket: bucket, gcs: gcsClient}, nil
}

// Close libera los recursos del cliente GCS.
func (c *Client) Close() error {
	return c.gcs.Close()
}

// DownloadFile descarga un objeto del bucket privado y retorna su contenido en memoria.
// imagePath es la ruta del objeto dentro del bucket (ej. "/security/images/foto.jpg").
// El slash inicial se elimina automáticamente si está presente.
func (c *Client) DownloadFile(ctx context.Context, imagePath string) ([]byte, error) {
	objectName := imagePath
	if len(objectName) > 0 && objectName[0] == '/' {
		objectName = objectName[1:]
	}

	reader, err := c.gcs.Bucket(c.bucket).Object(objectName).NewReader(ctx)
	if err != nil {
		return nil, fmt.Errorf("storage.DownloadFile: error abriendo '%s': %w", objectName, err)
	}
	defer reader.Close()

	data, err := io.ReadAll(reader)
	if err != nil {
		return nil, fmt.Errorf("storage.DownloadFile: error leyendo '%s': %w", objectName, err)
	}

	return data, nil
}
