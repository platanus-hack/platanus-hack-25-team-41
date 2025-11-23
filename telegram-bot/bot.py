"""
Telegram Bot for Lost Dogs Finder
Allows users to report dog sightings via Telegram.
"""
import os
import base64
import logging
from io import BytesIO
from dotenv import load_dotenv
import httpx
from telegram import Update
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    ContextTypes,
    filters,
)

load_dotenv()

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Send welcome message when /start is issued."""
    welcome_message = """
🐕 ¡Bienvenido al Bot de Perritos Perdidos!

Para reportar un perrito callejero:
1. Envíame una foto del perrito
2. Opcionalmente, añade una descripción
3. Te enviaré un enlace para completar el reporte con la ubicación

Comandos disponibles:
/start - Ver este mensaje
/help - Ayuda
    """
    await update.message.reply_text(welcome_message)


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Send help message when /help is issued."""
    help_text = """
📋 Cómo usar el bot:

1. Envía una foto del perrito que encontraste
2. Puedes agregar una descripción en el mensaje (opcional)
3. El bot procesará la imagen y extraerá información del perrito
4. Recibirás un enlace para completar el reporte agregando la ubicación

Ejemplo:
- Solo foto: Envía la imagen
- Con descripción: "Perrito café, parece perdido" + imagen
    """
    await update.message.reply_text(help_text)


async def handle_photo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle photo messages and create draft sighting."""
    try:
        await update.message.reply_text("📸 Procesando la foto del perrito...")

        photo = update.message.photo[-1]
        file = await context.bot.get_file(photo.file_id)

        photo_bytes = BytesIO()
        await file.download_to_memory(photo_bytes)
        photo_bytes.seek(0)

        image_base64 = base64.b64encode(photo_bytes.read()).decode('utf-8')
        image_data_url = f"data:image/jpeg;base64,{image_base64}"

        description = update.message.caption or None

        payload = {
            "images": [image_data_url],
            "description": description
        }

        logger.info(f"Creating draft sighting for user {update.effective_user.id}")

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{API_BASE_URL}/api/sightings/draft",
                json=payload
            )
            response.raise_for_status()
            result = response.json()

        sighting_id = result["id"]
        share_link = f"{FRONTEND_URL}/reportar?draft={sighting_id}"

        attributes = result.get("attributes", [])
        attributes_text = ", ".join(attributes[:5]) if attributes else "Información extraída"

        success_message = f"""
✅ ¡Foto procesada exitosamente!

🐕 Información detectada:
{attributes_text}

📍 Para completar el reporte, abre este enlace y agrega la ubicación donde viste al perrito:

{share_link}

El enlace te llevará a la página donde podrás:
- Ver la foto y descripción
- Agregar la ubicación exacta en el mapa
- Completar el reporte
        """

        await update.message.reply_text(success_message)
        logger.info(f"Draft sighting created: {sighting_id}")

    except httpx.HTTPStatusError as e:
        logger.error(f"API error: {e.response.status_code} - {e.response.text}")
        error_detail = e.response.json().get("detail", "Error desconocido")

        if "no parecen mostrar un perro" in error_detail.lower():
            await update.message.reply_text(
                "❌ La imagen no parece mostrar un perro. Por favor, envía una foto clara de un perrito."
            )
        else:
            await update.message.reply_text(
                f"❌ Error al procesar la imagen: {error_detail}\n\nPor favor, intenta de nuevo."
            )
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        await update.message.reply_text(
            "❌ Ocurrió un error al procesar la imagen. Por favor, intenta de nuevo más tarde."
        )


async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle text messages without photos."""
    await update.message.reply_text(
        "📷 Por favor, envía una foto del perrito junto con tu mensaje.\n\n"
        "Puedes agregar una descripción como caption de la foto."
    )


async def error_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Log errors caused by updates."""
    logger.error(f"Update {update} caused error {context.error}")


def main():
    """Start the bot."""
    if not TELEGRAM_BOT_TOKEN:
        raise ValueError("TELEGRAM_BOT_TOKEN not set in environment variables")

    logger.info("Starting Telegram bot...")
    logger.info(f"API Base URL: {API_BASE_URL}")
    logger.info(f"Frontend URL: {FRONTEND_URL}")

    application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()

    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(MessageHandler(filters.PHOTO, handle_photo))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))

    application.add_error_handler(error_handler)

    logger.info("Bot is ready! Starting polling...")
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
