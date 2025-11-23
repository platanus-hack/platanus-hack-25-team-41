"""
Matching service for finding similar dogs based on attributes and image similarity.
Uses Jaccard similarity, vector similarity, and distance-based filtering.
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

    def find_matches_by_attributes(
        self,
        db: Session,
        search_attributes: List[str],
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        radius_km: Optional[int] = None,
        limit: int = 20
    ) -> List[Tuple[DogSighting, float, Optional[float]]]:
        """Find matches using only attribute similarity."""
        if radius_km is None:
            radius_km = settings.search_radius_km

        candidates = db.query(DogSighting).filter(DogSighting.status == "active").all()
        results = []
        search_attr_set = set(search_attributes)

        for candidate in candidates:
            if not candidate.attributes:
                continue

            candidate_set = set(candidate.attributes)
            score = self.calculate_jaccard_similarity(search_attr_set, candidate_set)

            if score < settings.min_match_score:
                continue

            distance_km = None
            if latitude and longitude and candidate.latitude and candidate.longitude:
                distance_km = self.calculate_distance_km(latitude, longitude, candidate.latitude, candidate.longitude)
                if distance_km > radius_km:
                    continue

            results.append((candidate, score, distance_km))

        results.sort(key=lambda x: (x[1], -x[2] if x[2] is not None else 0), reverse=True)
        return results[:limit]

    def find_matches_by_vectors(
        self,
        db: Session,
        search_embedding: List[float],
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        radius_km: Optional[int] = None,
        limit: int = 20
    ) -> List[Tuple[DogSighting, float, Optional[float]]]:
        """Find matches using only vector similarity."""
        if radius_km is None:
            radius_km = settings.search_radius_km

        candidates = db.query(DogSighting).filter(
            DogSighting.status == "active",
            DogSighting.image_embedding.isnot(None)
        ).all()

        results = []
        for candidate in candidates:
            score = self.calculate_cosine_similarity(search_embedding, candidate.image_embedding)

            if score < settings.min_match_score:
                continue

            distance_km = None
            if latitude and longitude and candidate.latitude and candidate.longitude:
                distance_km = self.calculate_distance_km(latitude, longitude, candidate.latitude, candidate.longitude)
                if distance_km > radius_km:
                    continue

            results.append((candidate, score, distance_km))

        results.sort(key=lambda x: (x[1], -x[2] if x[2] is not None else 0), reverse=True)
        return results[:limit]

    def merge_search_results(
        self,
        attribute_results: List[Tuple[DogSighting, float, Optional[float]]],
        vector_results: List[Tuple[DogSighting, float, Optional[float]]],
        limit: int = 20
    ) -> List[Tuple[DogSighting, float, Optional[float]]]:
        """
        Merge results using Reciprocal Rank Fusion.

        RRF Score = sum(1 / (k + rank)) where k=60 is standard
        """
        k = 60
        scores = {}

        for rank, (sighting, score, dist) in enumerate(attribute_results, 1):
            sighting_id = sighting.id
            if sighting_id not in scores:
                scores[sighting_id] = {
                    'sighting': sighting,
                    'rrf_score': 0,
                    'attr_score': score,
                    'vector_score': None,
                    'distance': dist
                }
            scores[sighting_id]['rrf_score'] += 1 / (k + rank)
            scores[sighting_id]['attr_score'] = score

        for rank, (sighting, score, dist) in enumerate(vector_results, 1):
            sighting_id = sighting.id
            if sighting_id not in scores:
                scores[sighting_id] = {
                    'sighting': sighting,
                    'rrf_score': 0,
                    'attr_score': None,
                    'vector_score': score,
                    'distance': dist
                }
            scores[sighting_id]['rrf_score'] += 1 / (k + rank)
            scores[sighting_id]['vector_score'] = score

        merged = sorted(scores.values(), key=lambda x: x['rrf_score'], reverse=True)[:limit]

        return [(item['sighting'], item['rrf_score'], item['distance']) for item in merged]

    def find_matches_with_vectors(
        self,
        db: Session,
        search_attributes: Optional[List[str]] = None,
        search_embedding: Optional[List[float]] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        radius_km: Optional[int] = None,
        limit: int = 20
    ) -> List[Tuple[DogSighting, float, Optional[float]]]:
        """
        Find matches using separate attribute + vector search, then merge.
        Uses Reciprocal Rank Fusion for combining results.
        """
        attribute_results = []
        vector_results = []

        if search_attributes:
            attribute_results = self.find_matches_by_attributes(
                db, search_attributes, latitude, longitude, radius_km, limit
            )

        if search_embedding is not None:
            vector_results = self.find_matches_by_vectors(
                db, search_embedding, latitude, longitude, radius_km, limit
            )

        if len(attribute_results) > 0 and len(vector_results) > 0:
            return self.merge_search_results(attribute_results, vector_results, limit)
        elif len(vector_results) > 0:
            return vector_results
        elif len(attribute_results) > 0:
            return attribute_results
        else:
            return []

    @staticmethod
    def calculate_cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
        """
        Calculate cosine similarity between two vectors.

        Args:
            vec1: First vector
            vec2: Second vector

        Returns:
            float: Similarity score between 0 and 1
        """
        if vec1 is None or vec2 is None or len(vec1) != len(vec2):
            return 0.0

        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        magnitude1 = math.sqrt(sum(a * a for a in vec1))
        magnitude2 = math.sqrt(sum(b * b for b in vec2))

        if magnitude1 == 0 or magnitude2 == 0:
            return 0.0

        similarity = dot_product / (magnitude1 * magnitude2)
        return max(0.0, min(1.0, similarity))

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