# Telegram Bot - Lost Dogs Finder

Telegram bot that allows users to report dog sightings by sending photos. The bot processes the image with AI and returns a shareable link to complete the report.

## Features

- 📸 Accept dog photos from users
- 🤖 Use AI to extract dog attributes (size, color, health status)
- 🔗 Generate shareable links with pre-filled information
- 📍 Users complete the report by adding location via web interface

## Setup

### 1. Create a Telegram Bot

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` command
3. Follow the instructions to create your bot
4. Copy the bot token provided by BotFather

### 2. Install Dependencies

```bash
cd telegram-bot
pip install -e .
# or using uv:
uv pip install -e .
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` file with your values:

```bash
# Get this from @BotFather
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz

# Backend API (update for production)
API_BASE_URL=http://localhost:8000

# Frontend URL (update for production)
FRONTEND_URL=http://localhost:3000
```

### 4. Run the Bot

Make sure your backend is running first, then:

```bash
python bot.py
```

## Usage

Users can interact with the bot:

1. `/start` - Welcome message
2. `/help` - Help and instructions
3. Send a photo of a dog (with optional description as caption)
4. Receive a shareable link to complete the report

## How It Works

1. User sends photo + description to bot
2. Telegram pushes update to bot via webhook (in production) or polling (local dev)
3. Bot uploads to `/api/sightings/draft` endpoint
4. Backend processes image with LLM, extracts dog attributes
5. Bot returns link: `https://yoursite.com/reportar?draft=<uuid>`
6. User clicks link, adds location, submits report
7. Report becomes active and appears on the map

## Deployment Modes

**Production (Cloud Run):**
- Uses webhook mode
- Telegram sends updates directly to Cloud Run URL
- More efficient and cost-effective
- Automatically configured by deployment workflow

**Local Development:**
- Uses polling mode
- Bot actively checks for updates from Telegram
- Easier for development and testing
- No webhook configuration needed

## Production Deployment

### Automatic Deployment (GitHub Actions)

The bot automatically deploys to Google Cloud Run when changes are pushed to `main` branch.

**Required GitHub Secrets:**

Add these to your GitHub repository settings (Settings → Secrets and variables → Actions):

- `GCP_PROJECT_ID` - Your Google Cloud project ID
- `WIF_PROVIDER` - Workload Identity Federation provider
- `WIF_SERVICE_ACCOUNT` - Service account for WIF
- `TELEGRAM_BOT_TOKEN` - Your Telegram bot token from @BotFather
- `API_BASE_URL` - Production backend URL (e.g., `https://backend-xxx.run.app`)
- `FRONTEND_URL` - Production frontend URL (e.g., `https://yoursite.com`)

**Note:** `WEBHOOK_URL` is automatically set by the deployment workflow based on the Cloud Run service URL.

**Workflow Trigger:**

The deployment workflow (`.github/workflows/deploy-bot.yml`) runs when:
- Code is pushed to `main` branch
- Files in `telegram-bot/` directory are modified

### Manual Deployment

For production, consider:

- Use a webhook instead of polling for better performance
- Deploy on a server (not your local machine)
- Update `API_BASE_URL` and `FRONTEND_URL` to production URLs
- Use environment variables from your hosting platform
- Add error monitoring (e.g., Sentry)

Example webhook setup:

```python
application.run_webhook(
    listen="0.0.0.0",
    port=8443,
    webhook_url=f"https://yourdomain.com/{TELEGRAM_BOT_TOKEN}"
)
```

## Troubleshooting

**Bot doesn't respond:**
- Check that `TELEGRAM_BOT_TOKEN` is correct
- Ensure the bot is running (`python bot.py`)
- Check logs for errors

**"Error processing image":**
- Ensure backend is running and accessible
- Check `API_BASE_URL` is correct
- Verify backend has valid `GEMINI_API_KEY` configured

**Link doesn't work:**
- Check `FRONTEND_URL` is correct
- Ensure frontend is running and accessible
