FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

COPY pyproject.toml ./

RUN uv pip install --system --no-cache "python-telegram-bot[webhooks]" httpx python-dotenv

COPY bot.py .

CMD ["python", "bot.py"]
