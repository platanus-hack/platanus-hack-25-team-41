# BusCachorros

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

## 3. Solución Técnica

### Frontend (Next.js 14 + React)
- Interfaz responsive optimizada para uso móvil (mobile-first)
- Mapas interactivos con React Leaflet y OpenStreetMap
- Geolocalización del navegador en tiempo real
- Carga de imágenes con preview y validación
- Animaciones fluidas con Framer Motion
- Diseño con Tailwind CSS

### Backend (Python + FastAPI)
- API REST para gestión de avistamientos (CRUD)
- Procesamiento de imágenes y validación
- Integración con servicios de IA (Claude Vision)
- Base de datos PostgreSQL con extensión pgvector para embeddings
- Almacenamiento de imágenes en Google Cloud Storage

### Inteligencia Artificial
- **Detección de perros**: Validación automática de que la imagen subida realmente contiene un perro (respuesta 400 si no detecta)
- **Generación de embeddings**: Representación vectorial de cada imagen para búsqueda por similitud
- **Búsqueda semántica**: Comparación visual entre la foto de la mascota perdida y los avistamientos usando similitud coseno
- **Extracción de atributos**: Identificación automática de características (tamaño, color, raza aproximada)

### Infraestructura
- Frontend desplegado en Google Cloud Run
- Backend desplegado en Google Cloud Run
- Base de datos PostgreSQL en Cloud SQL con pgvector
- Almacenamiento de imágenes en Cloud Storage
- CI/CD con GitHub Actions

### Características destacadas
- **Área de probabilidad**: Círculos concéntricos en el mapa que estiman dónde podría estar el perro basado en el tiempo transcurrido desde el avistamiento
- **Sistema de contacto**: Conexión directa entre quien reporta y quien busca (llamada o WhatsApp)
- **Filtros inteligentes**: Por radio de distancia, área visible del mapa, y más

## 4. Resultados

Durante el hackathon logramos construir:

- Plataforma web funcional con flujo completo de reporte y búsqueda
- Sistema de matching por imagen con porcentaje de similitud visual
- Mapa interactivo con todos los avistamientos y filtros por ubicación
- Algoritmo de área de probabilidad basado en tiempo transcurrido
- Sistema de contacto entre reportantes y buscadores
- Validación de imágenes con IA (solo acepta fotos de perros)
- Interfaz responsive optimizada para uso en terreno desde el celular

## 5. Equipo

- Manuel Cifuentes ([@mecifuentes](https://github.com/mecifuentes))
- Eugenio Herrera ([@ouhenio](https://github.com/ouhenio))
- César Rivera ([@CesarRiveraMorales](https://github.com/CesarRiveraMorales))
- Clemente Henriquez ([@Clemente-H](https://github.com/Clemente-H))

---

**Hecho con ❤️ para Platanus Hack 2025**
