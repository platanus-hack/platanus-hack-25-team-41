"""
Matching service for finding similar dogs based on attributes.
Uses Jaccard similarity and distance-based filtering.
"""
from typing import List, Dict, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
import math

from app.models.dog_sighting import DogSighting
from app.config import settings


class MatchingService:
    """Service for matching dog attributes and finding similar dogs."""
    
    @staticmethod
    def calculate_jaccard_similarity(set_a: set, set_b: set) -> float:
        """
        Calculate Jaccard similarity between two sets.
        
        Jaccard similarity = |A ∩ B| / |A ∪ B|
        
        Args:
            set_a: First set of attributes
            set_b: Second set of attributes
            
        Returns:
            float: Similarity score between 0 and 1
        """
        if not set_a or not set_b:
            return 0.0
        
        intersection = len(set_a & set_b)
        union = len(set_a | set_b)
        
        return intersection / union if union > 0 else 0.0
    
    @staticmethod
    def calculate_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate distance between two coordinates using Haversine formula.
        
        Args:
            lat1, lon1: First coordinate
            lat2, lon2: Second coordinate
            
        Returns:
            float: Distance in kilometers
        """
        # Radius of Earth in km
        R = 6371.0
        
        # Convert to radians
        lat1_rad = math.radians(lat1)
        lon1_rad = math.radians(lon1)
        lat2_rad = math.radians(lat2)
        lon2_rad = math.radians(lon2)
        
        # Haversine formula
        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad
        
        a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        
        return R * c
    
    def find_matches(
        self,
        db: Session,
        search_attributes: List[str],
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        radius_km: Optional[int] = None,
        limit: int = 20
    ) -> List[Tuple[DogSighting, float, Optional[float]]]:
        """
        Find matching dog sightings based on attributes and location.
        
        Args:
            db: Database session
            search_attributes: List of attributes to search for
            latitude: Optional search latitude
            longitude: Optional search longitude
            radius_km: Optional radius for location filtering (default from config)
            limit: Maximum results to return
            
        Returns:
            List of tuples: (DogSighting, match_score, distance_km)
            Sorted by match score descending
        """
        # Use config radius if not provided
        if radius_km is None:
            radius_km = settings.search_radius_km
        
        # Query active sightings only
        query = db.query(DogSighting).filter(
            DogSighting.status == "active"
        )
        
        # Get all candidates
        candidates = query.all()
        
        # Calculate match scores
        results = []
        search_set = set(search_attributes)
        
        for candidate in candidates:
            # Calculate Jaccard similarity
            candidate_set = set(candidate.attributes)
            match_score = self.calculate_jaccard_similarity(search_set, candidate_set)
            
            # Skip if below minimum threshold
            if match_score < settings.min_match_score:
                continue
            
            # Calculate distance if location provided
            distance_km = None
            if latitude and longitude and candidate.latitude and candidate.longitude:
                distance_km = self.calculate_distance_km(
                    latitude, longitude,
                    candidate.latitude, candidate.longitude
                )
                
                # Skip if outside radius
                if distance_km > radius_km:
                    continue
            
            results.append((candidate, match_score, distance_km))
        
        # Sort by match score (primary) and distance (secondary)
        results.sort(
            key=lambda x: (x[1], -x[2] if x[2] is not None else 0),
            reverse=True
        )
        
        # Return top N results
        return results[:limit]
    
    def rank_results(
        self,
        results: List[Tuple[DogSighting, float, Optional[float]]]
    ) -> List[Dict]:
        """
        Convert raw results to ranked list with metadata.
        
        Args:
            results: List of (DogSighting, match_score, distance_km) tuples
            
        Returns:
            List of dicts with sighting data and match metadata
        """
        ranked = []
        
        for sighting, match_score, distance_km in results:
            ranked.append({
                "sighting": sighting,
                "match_score": round(match_score, 3),
                "distance_km": round(distance_km, 2) if distance_km else None,
            })
        
        return ranked


# Global instance
matching_service = MatchingService()