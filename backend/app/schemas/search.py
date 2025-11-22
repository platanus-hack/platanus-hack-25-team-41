"""
Pydantic schemas for search functionality.
"""
from pydantic import BaseModel, Field
from typing import List, Optional

from app.schemas.dog_sighting import DogSightingSearchResult


class SearchResponse(BaseModel):
    """Schema for search results."""
    results: List[DogSightingSearchResult]
    search_attributes: List[str] = Field(..., description="Attributes extracted from search query")
    total_results: int


class ReunionReportCreate(BaseModel):
    """Schema for creating a reunion report."""
    dog_sighting_id: str = Field(..., description="UUID of the dog sighting")
    message: Optional[str] = Field(None, description="Optional message from user")
    # verification_image will be uploaded via multipart/form-data


class ReunionReportResponse(BaseModel):
    """Schema for reunion report response."""
    id: str
    status: str
    message: str = "Tu reporte ha sido enviado. Lo revisaremos pronto."