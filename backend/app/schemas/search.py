"""
Pydantic schemas for search functionality.
"""
from pydantic import BaseModel, Field
from typing import List, Optional

from app.schemas.dog_sighting import DogSightingSearchResult


class SearchRequest(BaseModel):
    """Schema for search with images and/or description."""
    images: Optional[List[str]] = Field(None, description="Optional base64-encoded images")
    description: Optional[str] = Field(None, description="Optional text description")
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    radius: Optional[int] = Field(None, description="Search radius in km")
    limit: int = Field(20, ge=1, le=100)


class SearchResponse(BaseModel):
    """Schema for search results."""
    results: List[DogSightingSearchResult]
    search_attributes: List[str] = Field(..., description="Attributes extracted from search query")
    total_results: int