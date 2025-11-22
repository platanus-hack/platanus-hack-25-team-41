"""
Storage service for uploading images to Google Cloud Storage.
"""
from google.cloud import storage
from fastapi import UploadFile
import uuid
from datetime import datetime
from typing import List

from app.config import settings


class StorageService:
    """Service for managing image uploads to GCS."""
    
    def __init__(self):
        """Initialize GCS client."""
        self.client = storage.Client(project=settings.gcp_project_id)
        self.bucket = self.client.bucket(settings.gcs_bucket_name)
    
    async def upload_image(self, file: UploadFile) -> str:
        """
        Upload a single image to GCS.
        
        Args:
            file: FastAPI UploadFile object
            
        Returns:
            str: Public URL of the uploaded image
            
        Raises:
            ValueError: If file is too large or invalid format
        """
        # Validate file size
        file_content = await file.read()
        file_size_mb = len(file_content) / (1024 * 1024)
        
        if file_size_mb > settings.max_image_size_mb:
            raise ValueError(f"Image too large. Max size: {settings.max_image_size_mb}MB")
        
        # Validate file format
        valid_formats = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
        if file.content_type not in valid_formats:
            raise ValueError(f"Invalid format. Allowed: {', '.join(valid_formats)}")
        
        # Generate unique filename
        file_extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        filename = f"{uuid.uuid4()}_{int(datetime.now().timestamp())}.{file_extension}"
        
        # Upload to GCS
        blob = self.bucket.blob(f"dog_sightings/{filename}")
        blob.upload_from_string(
            file_content,
            content_type=file.content_type
        )

        # Return public URL (bucket must have uniform bucket-level access with allUsers Reader permission)
        return f"https://storage.googleapis.com/{settings.gcs_bucket_name}/{blob.name}"
    
    async def upload_multiple_images(self, files: List[UploadFile]) -> List[str]:
        """
        Upload multiple images to GCS.
        
        Args:
            files: List of FastAPI UploadFile objects
            
        Returns:
            List[str]: List of public URLs
            
        Raises:
            ValueError: If too many files or validation fails
        """
        if len(files) > settings.max_images_per_sighting:
            raise ValueError(
                f"Too many images. Max: {settings.max_images_per_sighting}"
            )
        
        urls = []
        for file in files:
            # Reset file pointer for each upload
            await file.seek(0)
            url = await self.upload_image(file)
            urls.append(url)
        
        return urls
    
    async def delete_image(self, image_url: str) -> bool:
        """
        Delete an image from GCS.
        
        Args:
            image_url: Public URL of the image
            
        Returns:
            bool: True if deleted successfully
        """
        try:
            # Extract blob name from URL
            # URL format: https://storage.googleapis.com/bucket-name/path/to/file.jpg
            blob_name = image_url.split(f"{settings.gcs_bucket_name}/")[-1]
            blob = self.bucket.blob(blob_name)
            blob.delete()
            return True
        except Exception as e:
            print(f"Error deleting image: {e}")
            return False


# Global instance
storage_service = StorageService()