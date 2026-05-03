package gemini

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

// Client es el cliente que implementa consultation.AIClient usando Gemini.
type Client struct {
	apiKey string
	model  string
}

// NewClient crea un cliente Gemini listo para usar.
// Si model está vacío usa gemini-2.0-flash como default.
func NewClient(apiKey, model string) *Client {
	if model == "" {
		model = "gemini-2.0-flash"
	}
	return &Client{apiKey: apiKey, model: model}
}

// Analyze envía el prompt del sistema + la imagen + el presupuesto a Gemini y
// parsea la respuesta JSON hacia SecurityAnalysis.
func (c *Client) Analyze(ctx context.Context, optionID int, imageData []byte, budget *float64) (SecurityAnalysis, error) {
	client, err := genai.NewClient(ctx, option.WithAPIKey(c.apiKey))
	if err != nil {
		return SecurityAnalysis{}, fmt.Errorf("gemini: error creando cliente: %w", err)
	}
	defer client.Close()

	model := client.GenerativeModel(c.model)

	// Configurar el modelo para respuesta JSON estricta
	model.ResponseMIMEType = "application/json"
	model.Temperature = genai.Ptr[float32](0.2) // baja temperatura = respuestas más deterministas

	systemPrompt := GetSystemPrompt(optionID)
	if budget != nil {
		systemPrompt += fmt.Sprintf("\n\nEl presupuesto disponible del usuario es de $%.0f CLP. Ajusta las recomendaciones a ese presupuesto.", *budget)
	}

	model.SystemInstruction = &genai.Content{
		Parts: []genai.Part{genai.Text(systemPrompt)},
	}

	// Construir el mensaje con la imagen
	userParts := []genai.Part{
		genai.ImageData("jpeg", imageData),
		genai.Text("Analiza esta imagen de mi hogar."),
	}

	resp, err := model.GenerateContent(ctx, userParts...)
	if err != nil {
		return SecurityAnalysis{}, fmt.Errorf("gemini: error generando contenido: %w", err)
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return SecurityAnalysis{}, fmt.Errorf("gemini: respuesta vacía del modelo")
	}

	// Extraer el texto de la respuesta
	rawText := ""
	for _, part := range resp.Candidates[0].Content.Parts {
		if t, ok := part.(genai.Text); ok {
			rawText += string(t)
		}
	}

	// Limpiar posibles bloques de código markdown que el modelo incluya
	rawText = cleanJSON(rawText)

	// Parsear la respuesta JSON hacia la estructura definida
	var analysis SecurityAnalysis
	if err := json.Unmarshal([]byte(rawText), &analysis); err != nil {
		return SecurityAnalysis{}, fmt.Errorf("gemini: error parseando respuesta JSON: %w (respuesta: %s)", err, rawText)
	}

	return analysis, nil
}

// cleanJSON elimina bloques de código markdown si el modelo los incluye a pesar de las instrucciones.
func cleanJSON(s string) string {
	s = strings.TrimSpace(s)
	s = strings.TrimPrefix(s, "```json")
	s = strings.TrimPrefix(s, "```")
	s = strings.TrimSuffix(s, "```")
	return strings.TrimSpace(s)
}
