# BusCachorros 🔎🐕

Plataforma colaborativa para reportar y buscar perros callejeros mediante reconocimiento de imagen y geolocalización.

## 1. El Problema

En Chile existen más de **4 millones de perros callejeros**, una cifra que crece cada año. Paralelamente, miles de familias pierden a sus mascotas sin tener herramientas efectivas para encontrarlas.

Los métodos tradicionales como carteles en postes, publicaciones en redes sociales y grupos de WhatsApp son:
- **Fragmentados**: La información está dispersa en múltiples plataformas
- **Desorganizados**: No hay forma de buscar sistemáticamente
- **Poco eficientes**: Dependen de que alguien vea el cartel correcto en el momento correcto

**No existe un sistema centralizado que conecte a quienes ven perros en la calle con quienes los buscan desesperadamente.**

## 2. Nuestra Propuesta

Creamos **BusCachorros**, una plataforma que democratiza la búsqueda de mascotas perdidas aprovechando el poder de la comunidad y la inteligencia artificial.

### Funcionalidades principales:

- **Reportar avistamientos**: Cualquier persona puede fotografiar y geolocalizar un perro callejero en segundos desde su celular
- **Buscar mascotas perdidas**: Los dueños suben una foto de su mascota y el sistema busca coincidencias automáticamente entre todos los avistamientos
- **Visualizar en mapa**: Todos los avistamientos se muestran en un mapa interactivo con filtros por ubicación y tiempo
- **Conectar personas**: Los reportantes pueden dejar su contacto para ser notificados si el perro que vieron resulta ser la mascota de alguien
- **Bot de Telegram**: Reportar avistamientos mediante chat conversacional, facilitando la adopción y uso desde plataformas de mensajería

## 3. Solución Técnica

### Frontend (Next.js 14 + React)
- Interfaz responsive optimizada para uso móvil (mobile-first)
- Mapas interactivos con React Leaflet y OpenStreetMap
- Geolocalización del navegador en tiempo real
- Carga de imágenes con preview y validaciónUpdate front
- Animaciones fluidas con Framer Motion
- Diseño con Tailwind CSS

### Backend (Python + FastAPI)
- API REST para gestión de avistamientos (CRUD)
- Procesamiento de imágenes y validación
- Integración con servicios de IA (Vertex AI)
- Base de datos PostgreSQL con extensión pgvector para embeddings
- Almacenamiento de imágenes en Google Cloud Storage

### Inteligencia Artificial

Nuestro sistema no solo "llama a una API de IA" - implementamos una **arquitectura híbrida** que combina:
- Análisis visual de imágenes (¿se parecen los perros?)
- Análisis semántico de atributos (¿tienen las mismas características?)
- Ranking inteligente que fusiona ambos resultados

Esto significa que incluso con fotos de mala calidad o descripciones parciales, el sistema encuentra coincidencias.

#### Detalles técnicos del algoritmo:

**Componentes principales:**

- **Validación con Gemini 2.5 Flash**: Detección automática de perros en imágenes subidas con umbral de confianza > 0.7 (responde 400 si no detecta un perro o la confianza es insuficiente)

- **Extracción de atributos estructurados**: Identificación automática de características mediante LLM:
  - Físicas: raza aproximada, color(es) del pelaje, tamaño (pequeño/mediano/grande), edad estimada
  - Distintivas: accesorios (collar, arnés, placa), marcas especiales (manchas, cicatrices), tipo de pelaje
  - Output normalizado: atributos en minúsculas, sin tildes, con guiones bajos

- **Generación de embeddings multimodales**: Vectores de 1408 dimensiones por imagen usando Vertex AI (`multimodalembedding@001`) para representación visual densa y búsqueda por similitud

- **Motor de búsqueda dual**:
  - **Búsqueda por atributos**: Similitud de Jaccard entre conjuntos de características extraídas
  - **Búsqueda visual**: Similitud coseno entre embeddings de imágenes
  - **Fusión inteligente**: Reciprocal Rank Fusion (RRF) para combinar ambos resultados y maximizar precisión

- **Filtrado geoespacial**: Cálculo de distancia con fórmula de Haversine y filtrado por radio configurable

#### Flujo completo del algoritmo:

1. **Usuario sube foto(s) + descripción opcional**

2. **Validación con Gemini**: ¿es un perro? (confianza > 0.7)
   - NO → Error 400 "No parece un perro"
   - SÍ → Continúa

3. **Extracción de atributos estructurados**
   - Ejemplo: `["labrador", "amarillo", "mediano", "collar"]`

4. **Generación de embedding visual** (1408 dimensiones)
   - Vertex AI MultiModal Embeddings

5. **Búsqueda paralela**:
   - a) Jaccard Similarity (atributos textuales): `score = |A ∩ B| / |A ∪ B|`
   - b) Cosine Similarity (embeddings visuales): `cos(θ) = (A·B) / (||A|| × ||B||)`

6. **Filtrado geográfico**
   - Haversine + radio en kilómetros

7. **Fusión con Reciprocal Rank Fusion**
   - `RRF_score = Σ(1/(60 + rank))`
   - Combina resultados de ambas búsquedas

8. **Ranking final**
   - Ordenado por RRF score + distancia
   - Top N resultados con % de similitud

**Ventaja del enfoque híbrido**: Si la foto es de mala calidad pero la descripción es precisa (o viceversa), el sistema igual encuentra coincidencias. Los perros que aparecen en ambas listas (similitud visual + atributos) reciben scores superiores, reduciendo falsos positivos.

### Infraestructura
- Frontend desplegado en Google Cloud Run
- Backend desplegado en Google Cloud Run
- Bot de Telegram desplegado en Google Cloud Run
- Base de datos PostgreSQL en Cloud SQL con pgvector
- Almacenamiento de imágenes en Cloud Storage
- CI/CD con GitHub Actions

### Características destacadas
- **Área de probabilidad**: Círculos concéntricos en el mapa que estiman dónde podría estar el perro basado en el tiempo transcurrido desde el avistamiento
- **Sistema de contacto**: Conexión directa entre quien reporta y quien busca (llamada o WhatsApp)
- **Filtros inteligentes**: Por radio de distancia, área visible del mapa, y más
- **Reportes por Telegram**: Flujo conversacional para crear avistamientos mediante chat, compartiendo ubicación y fotos

## 4. Resultados del Hackathon

En 48 horas de desarrollo intensivo construimos un MVP completamente funcional:

**Funcionalidades implementadas:**
- ✅ Sistema end-to-end: desde reportar hasta encontrar con un match
- ✅ Pipeline completo de IA: validación, extracción de atributos, embeddings, y búsqueda híbrida
- ✅ Mapa interactivo con círculos de probabilidad basados en tiempo/distancia
- ✅ Bot de Telegram para reportes rápidos desde mensajería
- ✅ Infraestructura productiva en Google Cloud (frontend, backend, bot, base de datos)

**Logros técnicos destacados:**
- Algoritmo de matching híbrido (Jaccard + Cosine Similarity + RRF)
- Validación automática de imágenes (rechaza no-perros)
- Sistema de embeddings visuales de 1408 dimensiones
- Interfaz mobile-first optimizada para uso en terreno
- Integración de múltiples servicios de Google Cloud (Vertex AI, Cloud Run, Cloud SQL, GCS)

## 5. Impacto y Escalabilidad

**Impacto potencial:**
- Sistema escalable para toda Latinoamérica (problema regional con millones de perros callejeros)
- Reducción significativa en tiempo de búsqueda vs. métodos tradicionales (carteles, grupos de WhatsApp)
- Democratiza el acceso a tecnología de búsqueda por IA para cualquier persona con un celular
- Potencial colaboración con fundaciones de rescate animal y municipalidades

**Próximos pasos:**
- Integración con organizaciones de protección animal y municipalidades
- Sistema de notificaciones push para alertar matches en tiempo real
- App móvil nativa para mejor captura de ubicación y fotos
- Expansión del modelo de IA con fine-tuning en razas locales, estimaciones de ubicación, etc
- Funcionalidad de "perro perdido" vs "perro encontrado" para matching bidireccional

## 6. Equipo

- Manuel Cifuentes ([@mecifuentes](https://github.com/mecifuentes))
- Eugenio Herrera ([@ouhenio](https://github.com/ouhenio))
- César Rivera ([@CesarRiveraMorales](https://github.com/CesarRiveraMorales))
- Clemente Henriquez ([@Clemente-H](https://github.com/Clemente-H))

---

**Hecho con ❤️ para Platanus Hack 2025**
