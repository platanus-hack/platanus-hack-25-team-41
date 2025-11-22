import os
import json
import base64
from pathlib import Path
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

LIMITE_PERROS = 100 

def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.standard_b64encode(image_file.read()).decode("utf-8")

def get_image_media_type(image_path):
    ext = Path(image_path).suffix.lower()
    media_types = {
        '.png': 'image/png'
    }
    return media_types.get(ext, 'image/png')

def analyze_dog_images(folder_path, api_key):
    client = Anthropic(api_key=api_key)

    image_files = sorted([
        f for f in os.listdir(folder_path)
        if f.endswith(('.png', '.jpg', '.jpeg'))
    ])

    if not image_files:
        return {"error": "No images found in folder"}

    image_content = []
    for img_file in image_files:
        img_path = os.path.join(folder_path, img_file)
        image_data = encode_image(img_path)
        media_type = get_image_media_type(img_path)

        image_content.append({
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": media_type,
                "data": image_data,
            },
        })

    prompt = """Estas imágenes provienen de una publicación de Instagram sobre perros encontrados.

    Extrae la siguiente información que aparezca en las imágenes:
    1. Fecha en que encontraron al perro: Busca fechas explícitas, si no encuentras, esta la fecha de la publicación de Instagram.
    2. Ubicación/lugar donde lo encontraron (busca nombres de calles, comunas, barrios, referencias), agrega la ubicacion latitud y longitud.
    3. Cualquier información adicional relevante
    4. Informacion de contacto si está visible en las imágenes, la cuenta de Instagram @perritos_encontrados_santiago no es necesaria.


    Responde en formato JSON con la siguiente estructura:
    {
    "fecha": "fecha encontrada o null si no se encuentra",
    "ubicacion": "ubicación encontrada o null si no se encuentra",
    "descripcion_perro": "breve descripción del perro visible en las imágenes",
    "informacion_adicional": "cualquier otra información relevante encontrada",
    "informacion_contacto": "información de contacto encontrada o null si no se encuentra"
    }

    Si no encuentras alguna información, usa null en ese campo. Si el animal no es un perro, indica "No es un perro" en todos los campos.
    """

    # Build the message content
    message_content = image_content + [{"type": "text", "text": prompt}]

    # Call Claude API
    try:
        message = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": message_content
                }
            ]
        )

        # Extract the response
        response_text = message.content[0].text

        # Try to parse JSON from the response
        try:
            # Find JSON in the response (in case there's extra text)
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            if start_idx != -1 and end_idx > start_idx:
                json_str = response_text[start_idx:end_idx]
                extracted_info = json.loads(json_str)
            else:
                extracted_info = {"raw_response": response_text}
        except json.JSONDecodeError:
            extracted_info = {"raw_response": response_text}

        return extracted_info

    except Exception as e:
        return {"error": str(e)}

def main():

    # Get API key from environment variable
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("Error: ANTHROPIC_API_KEY environment variable not set")
        return
    # Path to imgs folder
    imgs_folder = Path(__file__).parent / "imgs"

    # Get all dog folders
    dog_folders = sorted([
        d for d in imgs_folder.iterdir()
        if d.is_dir() and d.name.startswith("perro_")
    ], key=lambda x: int(x.name.split('_')[1]))

    # Apply limit if configured
    total_folders = len(dog_folders)
    if LIMITE_PERROS is not None:
        dog_folders = dog_folders[:LIMITE_PERROS]
        print(f"Found {total_folders} dog folders, processing first {len(dog_folders)}")
    else:
        print(f"Found {len(dog_folders)} dog folders to process")

    results = {}

    # Process each dog folder
    for idx, dog_folder in enumerate(dog_folders, 1):
        folder_name = dog_folder.name
        print(f"\nProcessing {folder_name} ({idx}/{len(dog_folders)})...")

        # Analyze images in this folder
        info = analyze_dog_images(dog_folder, api_key)

        results[folder_name] = info

        # Print extracted info
        if "error" in info:
            print(f"  Error: {info['error']}")
        else:
            print(f"  Fecha: {info.get('fecha', 'N/A')}")
            print(f"  Ubicación: {info.get('ubicacion', 'N/A')}")

    # Save results to JSON file
    output_file = Path(__file__).parent / "dogs_analysis_results.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"\n✓ Results saved to {output_file}")
    print(f"✓ Processed {len(results)} dog folders")

if __name__ == "__main__":
    main()
