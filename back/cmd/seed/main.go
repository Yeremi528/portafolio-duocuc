// Seed script: popula la colección "peligros" en MongoDB con datos dummy.
// Uso: ENV=local go run ./cmd/seed/
package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"gopkg.in/yaml.v3"
)

type config struct {
	MongoURI string `yaml:"MONGODB_URI"`
}

type Peligro struct {
	Commune      string  `bson:"commune"`
	TipoDelito   string  `bson:"tipo_delito"`
	Probabilidad float64 `bson:"probabilidad"`
	Descripcion  string  `bson:"descripcion"`
}

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	data, err := os.ReadFile("config.yaml")
	if err != nil {
		log.Fatalf("no se pudo leer config.yaml: %v", err)
	}
	var cfg config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		log.Fatalf("error parseando config: %v", err)
	}

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(cfg.MongoURI))
	if err != nil {
		log.Fatalf("error conectando MongoDB: %v", err)
	}
	defer client.Disconnect(ctx)

	col := client.Database("security").Collection("peligros")

	// Limpiar colección antes de insertar
	_, _ = col.DeleteMany(ctx, bson.M{})

	docs := seedData()
	toInsert := make([]interface{}, len(docs))
	for i, d := range docs {
		toInsert[i] = d
	}

	res, err := col.InsertMany(ctx, toInsert)
	if err != nil {
		log.Fatalf("error insertando documentos: %v", err)
	}
	fmt.Printf("✅  Insertados %d documentos en la colección 'peligros'\n", len(res.InsertedIDs))
}

func p(commune, tipoDelito string, prob float64, desc string) Peligro {
	return Peligro{Commune: commune, TipoDelito: tipoDelito, Probabilidad: prob, Descripcion: desc}
}

func seedData() []Peligro {
	return []Peligro{
		// ── Santiago (Centro) ───────────────────────────────────────────
		p("Santiago", "Hurto", 0.85, "Alto índice de hurtos en espacios públicos, metro y zonas comerciales del centro."),
		p("Santiago", "Robo con violencia", 0.72, "Portonazo y asaltos en vía pública, especialmente en horario nocturno."),
		p("Santiago", "Robo en lugar no habitado", 0.65, "Robo a locales comerciales, oficinas y estacionamientos nocturnos."),
		p("Santiago", "Robo en lugar habitado", 0.58, "Vulneración de domicilios por escalamiento o fractura de acceso."),
		p("Santiago", "Delitos de drogas", 0.55, "Microtráfico y consumo en espacios públicos del sector."),
		p("Santiago", "Lesiones", 0.48, "Riñas y agresiones físicas vinculadas principalmente al ocio nocturno."),
		p("Santiago", "Robo de vehículo", 0.45, "Sustracción de vehículos en estacionamientos y vía pública."),

		// ── Maipú ───────────────────────────────────────────────────────
		p("Maipú", "Hurto", 0.62, "Hurtos en centros comerciales, ferias libres y transporte público."),
		p("Maipú", "Robo en lugar habitado", 0.55, "Robos a viviendas, especialmente en sectores de casas con acceso lateral."),
		p("Maipú", "Robo con violencia", 0.48, "Asaltos en calles con menor flujo peatonal en horario nocturno."),
		p("Maipú", "Robo en lugar no habitado", 0.45, "Robos a locales comerciales y bodegas fuera del horario de atención."),
		p("Maipú", "Delitos de drogas", 0.42, "Microtráfico en algunas villas y sectores periféricos de la comuna."),
		p("Maipú", "Lesiones", 0.38, "Lesiones vinculadas a conflictos vecinales y violencia intrafamiliar."),
		p("Maipú", "Robo de vehículo", 0.35, "Sustracción de vehículos y robo de accesorios desde autos estacionados."),

		// ── Puente Alto ─────────────────────────────────────────────────
		p("Puente Alto", "Hurto", 0.70, "Hurtos frecuentes en Mall Plaza y ferias de la zona sur."),
		p("Puente Alto", "Robo en lugar habitado", 0.65, "Robos a domicilios usando el método del 'bueno de día'."),
		p("Puente Alto", "Robo con violencia", 0.58, "Asaltos en espacios públicos, principalmente en horas punta."),
		p("Puente Alto", "Delitos de drogas", 0.52, "Microtráfico en poblaciones y zonas limítrofes de la comuna."),
		p("Puente Alto", "Lesiones", 0.48, "Agresiones físicas frecuentes, incluyendo contextos de violencia intrafamiliar."),
		p("Puente Alto", "Robo de vehículo", 0.42, "Robo de vehículos y de objetos desde el interior de autos."),
		p("Puente Alto", "Violencia intrafamiliar", 0.38, "Denuncias de violencia intrafamiliar por encima del promedio regional."),

		// ── Las Condes ──────────────────────────────────────────────────
		p("Las Condes", "Hurto", 0.35, "Hurtos menores en centros comerciales de alto flujo como Costanera Center."),
		p("Las Condes", "Robo de vehículo", 0.28, "Robo de vehículos de alta gama en estacionamientos y vía pública."),
		p("Las Condes", "Robo en lugar habitado", 0.22, "Robos a domicilios planificados, especialmente en casas con jardín."),
		p("Las Condes", "Robo con violencia", 0.18, "Portonazos ocasionales en sectores residenciales de alta plusvalía."),
		p("Las Condes", "Delitos de drogas", 0.15, "Consumo esporádico en espacios recreativos y parques."),
		p("Las Condes", "Lesiones", 0.20, "Lesiones de baja ocurrencia, principalmente en contexto de tráfico."),

		// ── Ñuñoa ───────────────────────────────────────────────────────
		p("Ñuñoa", "Hurto", 0.42, "Hurtos en áreas de restaurantes, bares y zonas de alta afluencia juvenil."),
		p("Ñuñoa", "Robo en lugar habitado", 0.32, "Robos a departamentos mediante engaño o escalamiento."),
		p("Ñuñoa", "Robo con violencia", 0.28, "Asaltos en calles con poca iluminación en horario nocturno."),
		p("Ñuñoa", "Delitos de drogas", 0.30, "Consumo y distribución menor en plazas y parques de la comuna."),
		p("Ñuñoa", "Lesiones", 0.25, "Riñas esporádicas en zonas de ocio nocturno."),
		p("Ñuñoa", "Robo de vehículo", 0.22, "Robo de objetos desde vehículos en zonas con poca vigilancia."),

		// ── La Florida ──────────────────────────────────────────────────
		p("La Florida", "Hurto", 0.58, "Hurtos en Tobalaba, Mall Florida Center y ferias del sector."),
		p("La Florida", "Robo en lugar habitado", 0.52, "Robos a domicilios en horario diurno aprovechando ausencia de moradores."),
		p("La Florida", "Robo con violencia", 0.42, "Asaltos en calles interiores y accesos a metro en horarios críticos."),
		p("La Florida", "Delitos de drogas", 0.38, "Microtráfico en algunas poblaciones del sector poniente de la comuna."),
		p("La Florida", "Lesiones", 0.35, "Agresiones físicas vinculadas a conflictos en espacios públicos."),
		p("La Florida", "Robo de vehículo", 0.30, "Sustracción de autos y motos, particularmente de noche."),

		// ── San Miguel ──────────────────────────────────────────────────
		p("San Miguel", "Hurto", 0.55, "Hurtos en Gran Avenida, mercados y transporte público."),
		p("San Miguel", "Robo con violencia", 0.45, "Asaltos en sectores de baja iluminación y calles secundarias."),
		p("San Miguel", "Robo en lugar habitado", 0.48, "Robos a departamentos en edificios sin seguridad reforzada."),
		p("San Miguel", "Delitos de drogas", 0.40, "Microtráfico en sectores limítrofes con La Cisterna y Pedro Aguirre Cerda."),
		p("San Miguel", "Lesiones", 0.38, "Lesiones físicas en contextos de riña y violencia doméstica."),
		p("San Miguel", "Robo de vehículo", 0.30, "Robos de vehículos y accesorios en estacionamientos."),

		// ── Providencia ─────────────────────────────────────────────────
		p("Providencia", "Hurto", 0.52, "Hurtos en Providencia, Suecia y zonas de restaurantes y oficinas."),
		p("Providencia", "Robo en lugar no habitado", 0.38, "Robos a oficinas y locales comerciales fuera del horario de funcionamiento."),
		p("Providencia", "Robo con violencia", 0.32, "Asaltos nocturnos en calles secundarias y salidas de bares."),
		p("Providencia", "Robo de vehículo", 0.28, "Sustracción de autos en zonas de alta rotación de estacionamientos."),
		p("Providencia", "Lesiones", 0.30, "Riñas nocturnas en el sector de bares y locales de entretenimiento."),
		p("Providencia", "Delitos de drogas", 0.35, "Consumo y comercialización menor en parques y plazas."),

		// ── Quilicura ───────────────────────────────────────────────────
		p("Quilicura", "Hurto", 0.65, "Hurtos frecuentes en centros comerciales y ferias de la zona norte."),
		p("Quilicura", "Robo en lugar habitado", 0.60, "Robos a domicilios en villas y sectores de expansión urbana reciente."),
		p("Quilicura", "Robo con violencia", 0.55, "Asaltos en zonas con baja densidad de carabineros y cámaras."),
		p("Quilicura", "Delitos de drogas", 0.50, "Microtráfico en sectores de vivienda social y límites con Pudahuel."),
		p("Quilicura", "Robo de vehículo", 0.40, "Robos de vehículos, especialmente en zonas industriales y de bodegas."),
		p("Quilicura", "Lesiones", 0.38, "Agresiones físicas en espacios públicos y contextos intrafamiliares."),

		// ── Recoleta ────────────────────────────────────────────────────
		p("Recoleta", "Hurto", 0.72, "Hurtos masivos en el Barrio Patronato, mercado persa y vías de acceso al metro."),
		p("Recoleta", "Robo con violencia", 0.65, "Asaltos frecuentes en horas nocturnas y en sectores de alta vulnerabilidad."),
		p("Recoleta", "Delitos de drogas", 0.62, "Microtráfico activo en múltiples sectores, especialmente cerca de hospederías."),
		p("Recoleta", "Robo en lugar no habitado", 0.58, "Robos a locales y depósitos durante la madrugada."),
		p("Recoleta", "Lesiones", 0.55, "Altas tasas de lesiones físicas vinculadas a riñas en vía pública."),
		p("Recoleta", "Violencia intrafamiliar", 0.48, "Denuncias frecuentes de VIF en sectores de alta densidad poblacional."),

		// ── Estación Central ────────────────────────────────────────────
		p("Estación Central", "Hurto", 0.80, "Zona de muy alto riesgo de hurto por flujo de la Estación Alameda y Rodoviario."),
		p("Estación Central", "Robo con violencia", 0.72, "Asaltos frecuentes en inmediaciones de terminales de buses y metro."),
		p("Estación Central", "Delitos de drogas", 0.68, "Alta concentración de microtráfico en sectores aledaños a la terminal."),
		p("Estación Central", "Robo en lugar no habitado", 0.62, "Robos a comercio minorista y locales de la zona en horario nocturno."),
		p("Estación Central", "Lesiones", 0.58, "Agresiones físicas por riñas en contexto de concentración masiva de personas."),
		p("Estación Central", "Robo de vehículo", 0.50, "Sustracción de vehículos en estacionamientos de la terminal y alrededores."),

		// ── Huechuraba ──────────────────────────────────────────────────
		p("Huechuraba", "Robo en lugar habitado", 0.68, "Robos a domicilios en sectores de villas y condominios del sector norte."),
		p("Huechuraba", "Hurto", 0.62, "Hurtos en centros comerciales del eje Recoleta y entorno del Costanera Norte."),
		p("Huechuraba", "Robo con violencia", 0.60, "Asaltos en sectores con baja vigilancia policial y alta densidad habitacional."),
		p("Huechuraba", "Delitos de drogas", 0.55, "Microtráfico en poblaciones vulnerables y límites con Conchalí."),
		p("Huechuraba", "Lesiones", 0.50, "Agresiones físicas frecuentes en zonas de mayor conflictividad social."),
		p("Huechuraba", "Robo de vehículo", 0.42, "Robos de vehículos en calles sin alumbrado y zonas con poca vigilancia."),

		// ── Peñalolén ───────────────────────────────────────────────────
		p("Peñalolén", "Robo en lugar habitado", 0.62, "Robos a domicilios en sectores de viviendas unifamiliares en laderas."),
		p("Peñalolén", "Hurto", 0.58, "Hurtos en el eje Grecia y zonas de comercio del sector oriente."),
		p("Peñalolén", "Robo con violencia", 0.52, "Asaltos en calles con poca iluminación del sector alto de la comuna."),
		p("Peñalolén", "Delitos de drogas", 0.48, "Microtráfico en algunos sectores de la población Lo Hermida."),
		p("Peñalolén", "Lesiones", 0.42, "Agresiones físicas en contextos de conflictos vecinales."),
		p("Peñalolén", "Robo de vehículo", 0.35, "Robos de vehículos en sectores con nula vigilancia nocturna."),

		// ── Vitacura ────────────────────────────────────────────────────
		p("Vitacura", "Robo de vehículo", 0.20, "Robo de vehículos de alta gama estacionados en vía pública."),
		p("Vitacura", "Robo en lugar habitado", 0.15, "Robos planificados a residencias de alto valor con equipos profesionales."),
		p("Vitacura", "Hurto", 0.25, "Hurtos en supermercados de alta gama y eventos exclusivos."),
		p("Vitacura", "Robo con violencia", 0.10, "Asaltos esporádicos de baja frecuencia pero alto impacto mediático."),
		p("Vitacura", "Delitos de drogas", 0.18, "Consumo en eventos privados y fiestas, baja presencia en espacio público."),

		// ── Lo Barnechea ────────────────────────────────────────────────
		p("Lo Barnechea", "Robo de vehículo", 0.25, "Sustracción de vehículos en zonas altas con acceso limitado a patrullaje."),
		p("Lo Barnechea", "Robo en lugar habitado", 0.20, "Robos planificados a casas de sectores cordilleranos con alta plusvalía."),
		p("Lo Barnechea", "Hurto", 0.28, "Hurtos menores en centros comerciales de Lo Barnechea y Av. Las Condes."),
		p("Lo Barnechea", "Robo con violencia", 0.15, "Asaltos de baja frecuencia en calles con poca vigilancia en la noche."),
		p("Lo Barnechea", "Delitos de drogas", 0.18, "Consumo esporádico en parques y zonas de esparcimiento."),

		// ── Conchalí ────────────────────────────────────────────────────
		p("Conchalí", "Hurto", 0.70, "Hurtos en comercio de Independencia y accesos al metro zona norte."),
		p("Conchalí", "Robo con violencia", 0.65, "Asaltos frecuentes en sectores de alta vulnerabilidad social."),
		p("Conchalí", "Delitos de drogas", 0.62, "Microtráfico activo en población La Pincoya y sectores aledaños."),
		p("Conchalí", "Robo en lugar habitado", 0.58, "Robos a domicilios en horario diurno con moradores ausentes."),
		p("Conchalí", "Lesiones", 0.55, "Alta incidencia de lesiones físicas en vía pública y contexto doméstico."),
		p("Conchalí", "Violencia intrafamiliar", 0.50, "Elevada tasa de VIF en comparación con el promedio regional."),

		// ── La Pintana ──────────────────────────────────────────────────
		p("La Pintana", "Robo con violencia", 0.82, "Una de las comunas con mayor incidencia de asaltos a mano armada del país."),
		p("La Pintana", "Delitos de drogas", 0.78, "Alta concentración de microtráfico y tráfico organizado en la comuna."),
		p("La Pintana", "Robo en lugar habitado", 0.72, "Robos a domicilios con violencia hacia los moradores."),
		p("La Pintana", "Hurto", 0.68, "Hurtos masivos en ferias y comercio local."),
		p("La Pintana", "Lesiones", 0.65, "Alta tasa de lesiones físicas graves en contexto de criminalidad organizada."),
		p("La Pintana", "Homicidio", 0.35, "Tasas de homicidio superiores al promedio regional vinculadas a conflictos entre bandas."),
		p("La Pintana", "Violencia intrafamiliar", 0.58, "Alta incidencia de VIF en sectores de alta vulnerabilidad social."),

		// ── El Bosque ───────────────────────────────────────────────────
		p("El Bosque", "Robo con violencia", 0.75, "Asaltos frecuentes en vía pública y en accesos al transporte público."),
		p("El Bosque", "Delitos de drogas", 0.70, "Presencia significativa de microtráfico en poblaciones del sector."),
		p("El Bosque", "Robo en lugar habitado", 0.65, "Robos a domicilios, especialmente en sectores de casas de material ligero."),
		p("El Bosque", "Hurto", 0.65, "Hurtos en ferias, mercados populares y transporte público."),
		p("El Bosque", "Lesiones", 0.60, "Alta incidencia de agresiones físicas en contexto de violencia callejera."),
		p("El Bosque", "Violencia intrafamiliar", 0.52, "Denuncias de VIF por encima del promedio de la Región Metropolitana."),
	}
}
