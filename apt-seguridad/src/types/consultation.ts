export type RiskLevel = 'alto' | 'medio' | 'bajo';
export type Priority = 'inmediata' | 'corto_plazo' | 'largo_plazo';
export type Severity = 'alta' | 'media' | 'baja';
export type Category = 'físico' | 'tecnológico' | 'comportamental';

export type Vulnerability = {
  area: string;
  description: string;
  severity: Severity;
};

export type Recommendation = {
  action: string;
  description: string;
  category: Category;
};

export type InsuranceSuggestion = {
  type: string;
  description: string;
  benefit: string;
};

export type EstimatedCost = {
  min_clp: number;
  max_clp: number;
  note: string;
};

export type SecurityAnalysis = {
  overall_risk: RiskLevel;
  summary: string;
  vulnerabilities: Vulnerability[];
  recommendations: Recommendation[];
  insurance_suggestions: InsuranceSuggestion[];
  estimated_cost: EstimatedCost | null;
  priority: Priority;
};

export type AnalyzeRequest = {
  image_path: string;
  option_id: number;
  budget?: number | null;
};

export type ConsultaSummary = {
  id: string;
  option_id: number;
  image_path: string;
  overall_risk: RiskLevel;
  summary: string;
  created_at: string;
};

export type AnalysisOption = {
  id: number;
  title: string;
  description: string;
  icon: string;
  color: string;
};

export type Risk = {
  tipo_delito: string;
  probabilidad: number;
  descripcion: string;
};

export type RiskStats = {
  commune: string;
  risks: Risk[];
};

export type UserProfile = {
  rut: string;
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  comuna: string;
  region: string;
};

export const ANALYSIS_OPTIONS: AnalysisOption[] = [
  {
    id: 1,
    title: 'Plan de Mejora',
    description: 'Plan integral para fortalecer la seguridad de tu hogar',
    icon: 'shield-checkmark-outline',
    color: '#2563EB',
  },
  {
    id: 2,
    title: 'Evaluación de Vulnerabilidades',
    description: 'Detecta todos los puntos débiles físicos y tecnológicos',
    icon: 'search-outline',
    color: '#DC2626',
  },
  {
    id: 3,
    title: 'Recomendaciones',
    description: 'Consejos priorizados adaptados al contexto chileno',
    icon: 'bulb-outline',
    color: '#D97706',
  },
  {
    id: 4,
    title: 'Sugerencias de Seguro',
    description: 'Encuentra el seguro ideal para proteger tu hogar',
    icon: 'umbrella-outline',
    color: '#059669',
  },
];
