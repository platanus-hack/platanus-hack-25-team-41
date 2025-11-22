"""
LLM Service for extracting dog attributes using Gemini.

TODO: Tu colega debe implementar las llamadas reales a Gemini aquí.
Por ahora usa datos dummy para testing.
"""
from typing import List, Dict, Any, Optional
from fastapi import UploadFile

from app.config import settings

# TODO: Importar el SDK de Gemini
# import google.generativeai as genai
# genai.configure(api_key=settings.google_api_key)
# model = genai.GenerativeModel(settings.gemini_model)


async def dog_description(
    images: List[UploadFile],
    description: Optional[str] = None
) -> Dict[str, Any] | bool:
    """
    Extract dog attributes from images and/or description using Gemini.
    
    Args:
        images: List of 1-3 uploaded images
        description: Optional text description from user
        
    Returns:
        Dict with:
            - es_perro (bool): True if images show a dog
            - atributos (List[str]): List of extracted attributes
            - confianza (float): Confidence score (0-1)
        
        Or False if no images or not a dog.
    
    TODO: Implementar llamada real a Gemini
    
    Prompt sugerido:
    ```
    Analiza las siguientes imágenes de un animal.
    
    {f"Descripción del usuario: {description}" if description else ""}
    
    Tareas:
    1. VALIDACIÓN: Determina si las imágenes muestran un perro (confidence > 0.7).
       - Si NO es un perro o confidence < 0.7, responde con: {"es_perro": false}
       
    2. Si ES un perro, extrae los siguientes atributos en español:
       - RAZA: raza aproximada (ej: labrador, mestizo, quiltro, pastor_aleman)
       - COLOR: color(es) del pelaje (ej: amarillo, negro, cafe, blanco)
       - TAMAÑO: pequeno, mediano, grande
       - EDAD: cachorro, joven, adulto, senior
       - CARACTERÍSTICAS ESPECIALES:
         * Accesorios: collar, arnes, placa, cadena
         * Marcas distintivas: manchas, cicatrices, orejas_caidas
         * Estado: pelo_corto, pelo_largo, heridas, cojera
         * Otros detalles únicos
    
    Formato de respuesta (JSON estricto):
    {
      "es_perro": true,
      "atributos": ["raza", "color1", "color2", "tamano", "edad", "caracteristica1", ...],
      "confianza": 0.95
    }
    
    IMPORTANTE:
    - Atributos en minúsculas, sin tildes
    - Usa guiones bajos para espacios (ej: "pastor_aleman", "pelo_largo")
    - Sé específico pero conciso
    - Incluye SOLO atributos visibles en las imágenes
    ```
    """
    
    # ============================================================================
    # TODO: REEMPLAZAR ESTE BLOQUE CON LLAMADA REAL A GEMINI
    # ============================================================================
    
    # Validar que hay imágenes
    if not images or len(images) == 0:
        return False
    
    # DUMMY: Simular procesamiento
    print(f"[DUMMY LLM] Processing {len(images)} images...")
    if description:
        print(f"[DUMMY LLM] User description: {description}")
    
    # DUMMY: Retornar atributos de prueba
    dummy_response = {
        "es_perro": True,
        "atributos": [
            "mestizo",
            "cafe",
            "blanco",
            "mediano",
            "adulto",
            "collar_negro",
            "orejas_paradas",
            "pelo_corto"
        ],
        "confianza": 0.85
    }
    
    print(f"[DUMMY LLM] Extracted attributes: {dummy_response['atributos']}")
    return dummy_response
    
    # ============================================================================
    # TODO: Código real debería verse algo así:
    # ============================================================================
    # try:
    #     # Preparar imágenes para Gemini
    #     image_parts = []
    #     for img in images:
    #         content = await img.read()
    #         image_parts.append({
    #             "mime_type": img.content_type,
    #             "data": content
    #         })
    #     
    #     # Construir prompt
    #     prompt = f"""
    #     Analiza estas imágenes...
    #     {f"Descripción: {description}" if description else ""}
    #     ...resto del prompt...
    #     """
    #     
    #     # Llamar a Gemini
    #     response = model.generate_content([prompt] + image_parts)
    #     
    #     # Parsear respuesta JSON
    #     result = json.loads(response.text)
    #     
    #     return result
    # 
    # except Exception as e:
    #     print(f"Error calling Gemini: {e}")
    #     return False
    # ============================================================================


async def extract_search_attributes(
    images: Optional[List[UploadFile]] = None,
    description: Optional[str] = None
) -> List[str]:
    """
    Extract search attributes from images and/or description.
    
    Same as dog_description() but used for search queries.
    
    Args:
        images: Optional list of images
        description: Optional text description
        
    Returns:
        List[str]: List of attributes to search for
        
    TODO: Implementar llamada real a Gemini
    """
    
    # ============================================================================
    # TODO: REEMPLAZAR ESTE BLOQUE CON LLAMADA REAL A GEMINI
    # ============================================================================
    
    if not images and not description:
        return []
    
    # DUMMY: Simular extracción
    print(f"[DUMMY LLM] Extracting search attributes...")
    if images:
        print(f"[DUMMY LLM] Processing {len(images)} search images...")
    if description:
        print(f"[DUMMY LLM] Search description: {description}")
    
    # DUMMY: Retornar atributos de búsqueda de prueba
    dummy_attributes = ["mestizo", "cafe", "mediano"]
    
    print(f"[DUMMY LLM] Search attributes: {dummy_attributes}")
    return dummy_attributes
    
    # ============================================================================
    # TODO: Usar la misma lógica que dog_description()
    # pero retornar solo la lista de atributos
    # ============================================================================


# Helper function para tu colega
def _build_gemini_prompt(description: Optional[str] = None) -> str:
    """
    Build the prompt for Gemini.
    
    TODO: Tu colega puede ajustar este prompt según necesidad.
    """
    base_prompt = """
Analiza las siguientes imágenes de un animal.

{description_part}

Tareas:
1. VALIDACIÓN: Determina si las imágenes muestran un perro (confidence > 0.7).
   - Si NO es un perro o confidence < 0.7, responde con: {{"es_perro": false}}
   
2. Si ES un perro, extrae los siguientes atributos en español:
   - RAZA: raza aproximada (ej: labrador, mestizo, quiltro, pastor_aleman)
   - COLOR: color(es) del pelaje (ej: amarillo, negro, cafe, blanco)
   - TAMAÑO: pequeno, mediano, grande
   - EDAD: cachorro, joven, adulto, senior
   - CARACTERÍSTICAS ESPECIALES:
     * Accesorios: collar, arnes, placa, cadena
     * Marcas distintivas: manchas, cicatrices, orejas_caidas
     * Estado: pelo_corto, pelo_largo, heridas, cojera
     * Otros detalles únicos

Formato de respuesta (JSON estricto):
{{
  "es_perro": true,
  "atributos": ["raza", "color1", "color2", "tamano", "edad", "caracteristica1", ...],
  "confianza": 0.95
}}

IMPORTANTE:
- Atributos en minúsculas, sin tildes
- Usa guiones bajos para espacios (ej: "pastor_aleman", "pelo_largo")
- Sé específico pero conciso
- Incluye SOLO atributos visibles en las imágenes
"""
    
    description_part = f"Descripción del usuario: {description}" if description else ""
    return base_prompt.format(description_part=description_part)