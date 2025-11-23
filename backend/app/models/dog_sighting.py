"""
Dog Sighting model - represents a found dog report.
"""
from sqlalchemy import Column, String, Text, ARRAY, Float, DateTime, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from pgvector.sqlalchemy import Vector
import uuid

from app.database import Base


class DogSighting(Base):
    """
    Represents a report of a found dog.
    """
    __tablename__ = "dog_sightings"
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Images (GCS URLs)
    image_urls = Column(ARRAY(Text), nullable=False)
    
    # User description (optional)
    user_description = Column(Text, nullable=True)
    
    # Attributes extracted by LLM
    # Example: ["labrador", "amarillo", "grande", "adulto", "collar_rojo"]
    attributes = Column(JSONB, nullable=False)

    # Image embedding for similarity search (1408 dimensions for Vertex AI)
    image_embedding = Column(Vector(1408), nullable=True)

    # Location
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_address = Column(Text, nullable=True)
    neighborhood = Column(String(100), nullable=True)  # e.g., "Providencia"
    
    # Contact info (optional)
    contact_name = Column(String(255), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    contact_email = Column(String(255), nullable=True)
    
    # Status
    status = Column(
        String(20), 
        nullable=False, 
        default="active",
        # active = still looking, reunited = dog found, removed = deleted
    )
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<DogSighting(id={self.id}, attributes={self.attributes}, status={self.status})>"