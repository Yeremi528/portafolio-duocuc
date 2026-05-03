package claude

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/anthropics/anthropic-sdk-go"
	"github.com/anthropics/anthropic-sdk-go/option"
	"go-security/kit/gemini"
)

// Client implementa consultation.AIClient usando la API de Claude (Anthropic).
type Client struct {
	inner *anthropic.Client
	model string
}

// NewClient crea un cliente Claude listo para usar.
// Si model está vacío usa claude-haiku-4-5-20251001 (modelo más económico con visión).
func NewClient(apiKey, model string) *Client {
	if model == "" {
		model = "claude-haiku-4-5-20251001"
	}
	c := anthropic.NewClient(option.WithAPIKey(apiKey))
	return &Client{inner: &c, model: model}
}

// Analyze envía la imagen + prompt a Claude y parsea la respuesta JSON hacia SecurityAnalysis.
func (c *Client) Analyze(ctx context.Context, optionID int, imageData []byte, budget *float64) (gemini.SecurityAnalysis, error) {
	systemPrompt := gemini.GetSystemPrompt(optionID)
	if budget != nil {
		systemPrompt += fmt.Sprintf(
			"\n\nEl presupuesto disponible del usuario es de $%.0f CLP. Ajusta las recomendaciones a ese presupuesto.",
			*budget,
		)
	}

	b64 := base64.StdEncoding.EncodeToString(imageData)

	msg, err := c.inner.Messages.New(ctx, anthropic.MessageNewParams{
		Model:     anthropic.Model(c.model),
		MaxTokens: 2048,
		System: []anthropic.TextBlockParam{
			{Text: systemPrompt},
		},
		Messages: []anthropic.MessageParam{
			anthropic.NewUserMessage(
				anthropic.NewImageBlockBase64("image/jpeg", b64),
				anthropic.NewTextBlock("Analiza esta imagen de mi hogar."),
			),
		},
	})
	if err != nil {
		return gemini.SecurityAnalysis{}, fmt.Errorf("claude: error generando contenido: %w", err)
	}

	if len(msg.Content) == 0 {
		return gemini.SecurityAnalysis{}, fmt.Errorf("claude: respuesta vacía del modelo")
	}

	rawText := ""
	for _, block := range msg.Content {
		if block.Type == "text" {
			rawText += block.Text
		}
	}

	rawText = cleanJSON(rawText)

	var analysis gemini.SecurityAnalysis
	if err := json.Unmarshal([]byte(rawText), &analysis); err != nil {
		return gemini.SecurityAnalysis{}, fmt.Errorf("claude: error parseando JSON: %w (respuesta: %s)", err, rawText)
	}

	return analysis, nil
}

func cleanJSON(s string) string {
	s = strings.TrimSpace(s)
	s = strings.TrimPrefix(s, "```json")
	s = strings.TrimPrefix(s, "```")
	s = strings.TrimSuffix(s, "```")
	return strings.TrimSpace(s)
}
