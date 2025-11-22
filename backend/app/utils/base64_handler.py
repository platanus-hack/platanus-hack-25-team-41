"""
Utility for converting base64 images to file-like objects.
"""
import base64
import io
import mimetypes
from typing import List
from fastapi import UploadFile


class Base64UploadFile:
    """Wrapper to make base64 data compatible with UploadFile interface."""

    def __init__(self, base64_data: str, filename: str = "image.jpg"):
        if "," in base64_data:
            header, encoded = base64_data.split(",", 1)
            self.content_type = header.split(":")[1].split(";")[0] if ":" in header else "image/jpeg"
        else:
            encoded = base64_data
            self.content_type = "image/jpeg"

        self.content = base64.b64decode(encoded)
        self.filename = filename
        self._file = io.BytesIO(self.content)

    async def read(self) -> bytes:
        """Read file content."""
        return self._file.read()

    async def seek(self, position: int) -> None:
        """Seek to position in file."""
        self._file.seek(position)


def convert_base64_to_upload_files(base64_images: List[str]) -> List[Base64UploadFile]:
    """
    Convert list of base64 strings to Base64UploadFile objects.

    Args:
        base64_images: List of base64-encoded image strings

    Returns:
        List of Base64UploadFile objects
    """
    files = []
    for i, base64_str in enumerate(base64_images):
        extension = "jpg"
        if "data:image/" in base64_str:
            if "png" in base64_str:
                extension = "png"
            elif "webp" in base64_str:
                extension = "webp"

        filename = f"image_{i}.{extension}"
        files.append(Base64UploadFile(base64_str, filename))

    return files
