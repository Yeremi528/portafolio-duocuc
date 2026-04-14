package gemini

// SecurityAnalysis es la estructura unificada de respuesta para los 4 escenarios
// de análisis de seguridad del hogar. Gemini es instruido para devolver siempre
// un JSON que coincida exactamente con estos campos.
type SecurityAnalysis struct {
	// Evaluación general del riesgo: "alto", "medio" o "bajo"
	OverallRisk string `json:"overall_risk"`

	// Resumen ejecutivo del análisis
	Summary string `json:"summary"`

	// Lista de vulnerabilidades detectadas (relevante para opciones 1 y 2)
	Vulnerabilities []Vulnerability `json:"vulnerabilities,omitempty"`

	// Recomendaciones de mejora (relevante para opciones 1 y 3)
	Recommendations []Recommendation `json:"recommendations,omitempty"`

	// Sugerencias de seguros (relevante para opción 4)
	InsuranceSuggestions []InsuranceSuggestion `json:"insurance_suggestions,omitempty"`

	// Estimación de costo de implementación (cuando aplique)
	EstimatedCost *CostEstimate `json:"estimated_cost,omitempty"`

	// Prioridad de acción: "inmediata", "corto_plazo", "largo_plazo"
	Priority string `json:"priority"`
}

// Vulnerability describe un punto débil de seguridad identificado.
type Vulnerability struct {
	Area        string `json:"area"`        // ej. "puerta principal", "ventana trasera"
	Description string `json:"description"` // qué riesgo representa
	Severity    string `json:"severity"`    // "alta", "media", "baja"
}

// Recommendation es una acción concreta de mejora de seguridad.
type Recommendation struct {
	Action      string `json:"action"`      // qué hacer
	Description string `json:"description"` // por qué y cómo
	Category    string `json:"category"`    // "físico", "tecnológico", "comportamental"
}

// InsuranceSuggestion describe un tipo de seguro recomendado.
type InsuranceSuggestion struct {
	Type        string `json:"type"`        // ej. "seguro de hogar", "seguro de robo"
	Description string `json:"description"` // qué cubre
	Benefit     string `json:"benefit"`     // beneficio principal para el usuario
}

// CostEstimate es una estimación referencial del costo de mejoras.
type CostEstimate struct {
	MinCLP int    `json:"min_clp"` // mínimo en pesos chilenos
	MaxCLP int    `json:"max_clp"` // máximo en pesos chilenos
	Note   string `json:"note"`    // aclaración sobre la estimación
}
