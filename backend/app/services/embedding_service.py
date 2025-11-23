"""
Image embedding service using Vertex AI Multimodal Embeddings.
Generates vector embeddings from images for similarity search.
"""
from typing import List, Optional
from vertexai.vision_models import MultiModalEmbeddingModel, Image
import vertexai
from app.config import settings
import requests
import base64
from io import BytesIO


class EmbeddingService:
    """Service for generating image embeddings using Vertex AI."""

    def __init__(self):
        """Initialize Vertex AI and load the embedding model."""
        vertexai.init(project=settings.gcp_project_id, location="us-central1")
        self.model = MultiModalEmbeddingModel.from_pretrained("multimodalembedding@001")
        self.dimension = 1408

    async def generate_embedding_from_url(self, image_url: str) -> List[float]:
        """
        Generate embedding from an image URL.

        Args:
            image_url: GCS URL or HTTP URL of the image

        Returns:
            List[float]: 1408-dimensional embedding vector
        """
        try:
            image = Image.load_from_file(image_url)
            embeddings = self.model.get_embeddings(
                image=image,
                dimension=self.dimension
            )
            return embeddings.image_embedding
        except Exception as e:
            print(f"❌ Error generating embedding from URL: {e}")
            raise

    async def generate_embedding_from_bytes(self, image_bytes: bytes) -> List[float]:
        """
        Generate embedding from image bytes.

        Args:
            image_bytes: Raw image bytes

        Returns:
            List[float]: 1408-dimensional embedding vector
        """
        try:
            image = Image(image_bytes=image_bytes)
            embeddings = self.model.get_embeddings(
                image=image,
                dimension=self.dimension
            )
            return embeddings.image_embedding
        except Exception as e:
            print(f"❌ Error generating embedding from bytes: {e}")
            raise

    async def generate_embedding(self, image_source: str) -> Optional[List[float]]:
        """
        Generate embedding from URL, file path, or base64 data URI.

        Args:
            image_source: Image URL (GCS or HTTP), local file path, or base64 data URI

        Returns:
            List[float]: 1408-dimensional embedding vector, or None if failed
        """
        try:
            if image_source.startswith('data:image'):
                base64_data = image_source.split(',', 1)[1]
                image_bytes = base64.b64decode(base64_data)
                return await self.generate_embedding_from_bytes(image_bytes)
            elif image_source.startswith('http'):
                response = requests.get(image_source, timeout=30)
                response.raise_for_status()
                return await self.generate_embedding_from_bytes(response.content)
            else:
                return await self.generate_embedding_from_url(image_source)
        except Exception as e:
            print(f"❌ Failed to generate embedding for {image_source[:100]}...: {e}")
            return None


embedding_service = EmbeddingService()
