"""
Pydantic schemas for Dog Sighting endpoints.
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime
from uuid import UUID


class DogSightingCreate(BaseModel):
    """Schema for creating a new dog sighting with base64 images."""

    images: List[str] = Field(..., min_length=1, max_length=3, description="1-3 base64-encoded images")
    description: Optional[str] = Field(None, description="User description of the dog")
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    location_address: Optional[str] = None
    neighborhood: Optional[str] = None

    contact_name: Optional[str] = Field(None, max_length=255)
    contact_phone: Optional[str] = Field(None, max_length=20)
    contact_email: Optional[str] = Field(None, max_length=255)


class LocationResponse(BaseModel):
    """Schema for location data in responses."""
    lat: Optional[float] = None
    lng: Optional[float] = None
    address: Optional[str] = None
    neighborhood: Optional[str] = None


class ContactInfoResponse(BaseModel):
    """Schema for contact information in responses."""
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None


class DogSightingResponse(BaseModel):
    """Schema for dog sighting in responses."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    image_urls: List[str]
    user_description: Optional[str] = None
    attributes: List[str]  # From JSONB
    
    location: LocationResponse
    contact_info: Optional[ContactInfoResponse] = None
    
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    @classmethod
    def from_orm_model(cls, db_model):
        """Convert SQLAlchemy model to Pydantic schema."""
        return cls(
            id=db_model.id,
            image_urls=db_model.image_urls,
            user_description=db_model.user_description,
            attributes=db_model.attributes,
            location=LocationResponse(
                lat=db_model.latitude,
                lng=db_model.longitude,
                address=db_model.location_address,
                neighborhood=db_model.neighborhood,
            ),
            contact_info=ContactInfoResponse(
                name=db_model.contact_name,
                phone=db_model.contact_phone,
                email=db_model.contact_email,
            ) if db_model.contact_name or db_model.contact_phone else None,
            status=db_model.status,
            created_at=db_model.created_at,
            updated_at=db_model.updated_at,
        )


class DogSightingSearchResult(DogSightingResponse):
    """Schema for search results with additional match metadata."""
    match_score: float = Field(..., description="Similarity score (0-1)")
    distance_km: Optional[float] = Field(None, description="Distance from search point in km")


class DogSightingListResponse(BaseModel):
    """Schema for paginated list of sightings."""
    sightings: List[DogSightingResponse]
    total: int
    has_more: bool