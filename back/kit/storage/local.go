package storage

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
)

// LocalClient implementa StorageClient usando el filesystem local.
// Solo debe usarse en entorno de desarrollo (ENV=local).
type LocalClient struct {
	baseDir string // directorio raíz equivalente al bucket
}

// NewLocal crea un cliente de almacenamiento local.
// Los archivos se guardan en baseDir (ej. "./tmp/bucket").
func NewLocal(baseDir string) (*LocalClient, error) {
	if err := os.MkdirAll(baseDir, 0o755); err != nil {
		return nil, fmt.Errorf("storage.NewLocal: no se pudo crear %s: %w", baseDir, err)
	}
	return &LocalClient{baseDir: baseDir}, nil
}

func (c *LocalClient) Close() error { return nil }

func (c *LocalClient) UploadFile(_ context.Context, objectName string, data []byte, _ map[string]string) error {
	path := filepath.Join(c.baseDir, filepath.FromSlash(objectName))
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return fmt.Errorf("storage.LocalClient.UploadFile: mkdir: %w", err)
	}
	if err := os.WriteFile(path, data, 0o644); err != nil {
		return fmt.Errorf("storage.LocalClient.UploadFile: write: %w", err)
	}
	return nil
}

func (c *LocalClient) DownloadFile(_ context.Context, imagePath string) ([]byte, error) {
	if len(imagePath) > 0 && imagePath[0] == '/' {
		imagePath = imagePath[1:]
	}
	path := filepath.Join(c.baseDir, filepath.FromSlash(imagePath))
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("storage.LocalClient.DownloadFile: %w", err)
	}
	return data, nil
}
