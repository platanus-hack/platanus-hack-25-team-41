"""
LLM Service for extracting dog attributes using Gemini.
"""
from typing import List, Dict, Any, Optional
from fastapi import UploadFile
import json
import google.generativeai as genai
from PIL import Image
import io

from app.config import settings

# Configure Gemini
genai.configure(api_key=settings.google_api_key)
model = genai.GenerativeModel('gemini-2.5-flash')


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
    
    # Validar que hay imágenes
    if not images or len(images) == 0:
        return False

    try:
        print(f"🤖 Processing {len(images)} images with Gemini...")
        if description:
            print(f"📝 User description: {description}")

        # Preparar imágenes para Gemini
        image_parts = []
        for img in images:
            # Reset file pointer first in case it was read before
            await img.seek(0)
            content = await img.read()
            # Convert to PIL Image
            pil_image = Image.open(io.BytesIO(content))
            image_parts.append(pil_image)
            # Reset file pointer for potential later use
            await img.seek(0)

        # Construir prompt
        prompt = _build_gemini_prompt(description)

        # Llamar a Gemini
        response = model.generate_content([prompt] + image_parts)

        print(f"📊 Gemini response received")

        # Parse JSON from response
        response_text = response.text.strip()
        # Remove markdown code blocks if present
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()

        result = json.loads(response_text)

        print(f"✅ Extracted attributes: {result.get('atributos', [])}")
        print(f"📈 Confidence: {result.get('confianza', 0)}")

        return result

    except json.JSONDecodeError as e:
        print(f"❌ Error parsing Gemini JSON response: {e}")
        print(f"Response text: {response.text}")
        return False
    except Exception as e:
        print(f"❌ Error calling Gemini: {e}")
        import traceback
        traceback.print_exc()
        return False


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
    """
    if not images and not description:
        return []

    # If we have images, use the full dog_description function
    if images:
        result = await dog_description(images, description)
        if result and isinstance(result, dict):
            return result.get("atributos", [])
        return []

    # If only description, use Gemini to extract attributes from text
    try:
        print(f"🔍 Extracting search attributes from description...")

        prompt = f"""
Analiza la siguiente descripción de un perro y extrae los atributos relevantes.

Descripción: {description}

Extrae atributos como:
- RAZA: raza aproximada (ej: labrador, mestizo, quiltro, pastor_aleman)
- COLOR: color(es) del pelaje (ej: amarillo, negro, cafe, blanco)
- TAMAÑO: pequeno, mediano, grande
- EDAD: cachorro, joven, adulto, senior
- CARACTERÍSTICAS ESPECIALES: collar, arnes, manchas, orejas_caidas, pelo_corto, pelo_largo, etc.

Formato de respuesta (JSON estricto):
{{
  "atributos": ["raza", "color1", "color2", "tamano", "edad", "caracteristica1", ...]
}}

IMPORTANTE:
- Atributos en minúsculas, sin tildes
- Usa guiones bajos para espacios (ej: "pastor_aleman", "pelo_largo")
- Incluye SOLO atributos mencionados o claramente inferibles de la descripción
"""

        response = model.generate_content(prompt)
        response_text = response.text.strip()

        # Remove markdown code blocks if present
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()

        result = json.loads(response_text)
        attributes = result.get("atributos", [])

        print(f"✅ Search attributes: {attributes}")
        return attributes

    except Exception as e:
        print(f"❌ Error extracting search attributes: {e}")
        import traceback
        traceback.print_exc()
        return []


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