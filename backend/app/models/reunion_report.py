"""
Reunion Report model - represents a report that a dog was found by owner.
"""
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.database import Base


class ReunionReport(Base):
    """
    Represents a report from a user claiming they found their dog.
    Requires manual validation by admin.
    """
    __tablename__ = "reunion_reports"
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Reference to the dog sighting
    dog_sighting_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("dog_sightings.id", ondelete="CASCADE"),
        nullable=False
    )
    
    # Verification image (uploaded by user)
    verification_image_url = Column(Text, nullable=False)
    
    # Optional message from user
    user_message = Column(Text, nullable=True)
    
    # Validation status
    status = Column(
        String(20),
        nullable=False,
        default="pending",
        # pending = awaiting review, validated = confirmed, rejected = not a match
    )
    
    # Admin validation info
    validated_by = Column(String(255), nullable=True)  # Admin username/email
    validated_at = Column(DateTime(timezone=True), nullable=True)
    validation_notes = Column(Text, nullable=True)  # Admin notes
    
    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship (optional, for easier querying)
    # dog_sighting = relationship("DogSighting", backref="reunion_reports")
    
    def __repr__(self):
        return f"<ReunionReport(id={self.id}, dog_sighting_id={self.dog_sighting_id}, status={self.status})>"