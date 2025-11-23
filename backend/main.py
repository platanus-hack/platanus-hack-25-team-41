"""
Lost Dogs Finder - FastAPI Backend
Main application with all endpoints.
"""
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional
import uuid

from app.config import settings
from app.database import get_db, init_db
from app.models.dog_sighting import DogSighting
from app.schemas.dog_sighting import (
    DogSightingCreate,
    DogSightingResponse,
    DogSightingSearchResult,
    DogSightingListResponse,
    CompleteDraftRequest,
)
from app.schemas.search import SearchRequest, SearchResponse
from app.services.storage_service import storage_service
from app.services.llm_service import dog_description, extract_search_attributes
from app.services.matching_service import matching_service
from app.services.embedding_service import embedding_service
from app.utils.base64_handler import convert_base64_to_upload_files


def format_search_results(results):
    search_results = []
    for sighting, match_score, distance_km in results:
        # Create base response first
        base_response = DogSightingResponse.from_orm_model(sighting)
        # Then create search result with match_score
        result = DogSightingSearchResult(
            **base_response.model_dump(),
            match_score=match_score,
            distance_km=distance_km
        )
        search_results.append(result)
    return search_results


# ============================================================================
# FastAPI App Setup
# ============================================================================

app = FastAPI(
    title="Lost Dogs Finder API",
    description="API para reportar y buscar perros perdidos usando IA",
    version="1.0.0",
    docs_url="/docs" if settings.debug else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Startup & Shutdown Events
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    print("🚀 Starting Lost Dogs Finder API....")
    print(f"📍 Environment: {settings.environment}")
    print(f"🗄️  Database: {settings.database_url.split('@')[-1]}")
    print(f"☁️  GCS Bucket: {settings.gcs_bucket_name}")

    init_db()
    print("✅ Database initialized")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    print("👋 Shutting down Lost Dogs Finder API...")


# ============================================================================
# Health Check
# ============================================================================

@app.get("/api/health", tags=["Health"])
async def health_check(db: Session = Depends(get_db)):
    """
    Health check endpoint for monitoring.
    """
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"

        total_sightings = db.query(DogSighting).filter(DogSighting.status == "active").count()
        with_embeddings = db.query(DogSighting).filter(
            DogSighting.status == "active",
            DogSighting.image_embedding.isnot(None)
        ).count()

    except Exception as e:
        db_status = f"error: {str(e)}"
        total_sightings = 0
        with_embeddings = 0

    return {
        "status": "healthy" if db_status == "connected" else "unhealthy",
        "database": db_status,
        "gcs": "connected",
        "llm": "dummy",
        "environment": settings.environment,
        "embeddings": {
            "total_sightings": total_sightings,
            "with_embeddings": with_embeddings,
            "percentage": round(with_embeddings / total_sightings * 100, 1) if total_sightings > 0 else 0
        }
    }


# ============================================================================
# Dog Sighting Endpoints
# ============================================================================

@app.post(
    "/api/sightings",
    response_model=DogSightingResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Sightings"]
)
async def create_sighting(
    sighting: DogSightingCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new dog sighting report.

    - Provide 1-3 base64-encoded images of the found dog (required)
    - Optionally provide description and location
    - LLM automatically extracts dog attributes
    """
    try:
        print(f"📤 Converting {len(sighting.images)} base64 images...")
        images = convert_base64_to_upload_files(sighting.images)

        print(f"📤 Uploading {len(images)} images to GCS...")
        image_urls = await storage_service.upload_multiple_images(images)
        print(f"✅ Images uploaded: {image_urls}")

        print("🤖 Extracting dog attributes with LLM...")
        llm_result = await dog_description(images, sighting.description)

        if not llm_result or llm_result.get("es_perro") == False:
            for url in image_urls:
                await storage_service.delete_image(url)

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Las imágenes no parecen mostrar un perro. Por favor, sube imágenes claras de un perro."
            )

        attributes = llm_result.get("atributos", [])
        print(f"✅ Extracted attributes: {attributes}")

        print("🔢 Generating image embedding...")
        image_embedding = await embedding_service.generate_embedding(image_urls[0])
        if image_embedding is not None:
            print(f"✅ Embedding generated: {len(image_embedding)} dimensions")
        else:
            print("⚠️  Failed to generate embedding, continuing without it")

        new_sighting = DogSighting(
            image_urls=image_urls,
            user_description=sighting.description,
            attributes=attributes,
            image_embedding=image_embedding,
            latitude=sighting.latitude,
            longitude=sighting.longitude,
            location_address=sighting.location_address,
            neighborhood=sighting.neighborhood,
            contact_name=sighting.contact_name,
            contact_phone=sighting.contact_phone,
            contact_email=sighting.contact_email,
            status="active"
        )

        db.add(new_sighting)
        db.commit()
        db.refresh(new_sighting)

        print(f"✅ Sighting created with ID: {new_sighting.id}")

        return DogSightingResponse.from_orm_model(new_sighting)

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error creating sighting: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating sighting: {str(e)}"
        )


@app.post(
    "/api/sightings/draft",
    response_model=DogSightingResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Sightings"]
)
async def create_draft_sighting(
    sighting: DogSightingCreate,
    db: Session = Depends(get_db)
):
    """
    Create a draft dog sighting (for bot usage).

    - Provide 1-3 base64-encoded images of the found dog (required)
    - Optionally provide description
    - Location is NOT required (will be added later)
    - LLM automatically extracts dog attributes
    - Returns draft ID for sharing via bot
    """
    try:
        print(f"📤 Converting {len(sighting.images)} base64 images...")
        images = convert_base64_to_upload_files(sighting.images)

        print(f"📤 Uploading {len(images)} images to GCS...")
        image_urls = await storage_service.upload_multiple_images(images)
        print(f"✅ Images uploaded: {image_urls}")

        print("🤖 Extracting dog attributes with LLM...")
        llm_result = await dog_description(images, sighting.description)

        if not llm_result or llm_result.get("es_perro") == False:
            for url in image_urls:
                await storage_service.delete_image(url)

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Las imágenes no parecen mostrar un perro. Por favor, sube imágenes claras de un perro."
            )

        attributes = llm_result.get("atributos", [])
        print(f"✅ Extracted attributes: {attributes}")

        print("🔢 Generating image embedding...")
        image_embedding = await embedding_service.generate_embedding(image_urls[0])
        if image_embedding is not None:
            print(f"✅ Embedding generated: {len(image_embedding)} dimensions")
        else:
            print("⚠️  Failed to generate embedding, continuing without it")

        new_sighting = DogSighting(
            image_urls=image_urls,
            user_description=sighting.description,
            attributes=attributes,
            image_embedding=image_embedding,
            latitude=sighting.latitude,
            longitude=sighting.longitude,
            location_address=sighting.location_address,
            neighborhood=sighting.neighborhood,
            contact_name=sighting.contact_name,
            contact_phone=sighting.contact_phone,
            contact_email=sighting.contact_email,
            status="draft"
        )

        db.add(new_sighting)
        db.commit()
        db.refresh(new_sighting)

        print(f"✅ Draft sighting created with ID: {new_sighting.id}")

        return DogSightingResponse.from_orm_model(new_sighting)

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error creating draft sighting: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating draft sighting: {str(e)}"
        )


@app.get(
    "/api/sightings/search",
    response_model=SearchResponse,
    tags=["Search"]
)
async def search_sightings(
    description: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    radius: Optional[int] = None,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """
    Search for dogs matching description and/or location.
    
    - Provide text description of the dog you're looking for
    - Optionally provide location to filter by distance
    - Returns ranked list of matching dogs
    
    Note: To search by photo, use POST /api/sightings/search with multipart/form-data
    """
    try:
        print(f"🔍 Searching with description: {description}")
        search_attrs = await extract_search_attributes(description=description)

        if not search_attrs:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se pudieron extraer atributos de búsqueda. Proporciona más detalles."
            )

        print(f"🔍 Search attributes: {search_attrs}")

        results = matching_service.find_matches_with_vectors(
            db=db,
            search_attributes=search_attrs,
            search_embedding=None,
            latitude=latitude,
            longitude=longitude,
            radius_km=radius,
            limit=limit
        )

        search_results = format_search_results(results)
        print(f"✅ Found {len(search_results)} matches")
        
        return SearchResponse(
            results=search_results,
            search_attributes=search_attrs,
            total_results=len(search_results)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error searching: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error searching: {str(e)}"
        )


@app.post(
    "/api/sightings/search",
    response_model=SearchResponse,
    tags=["Search"]
)
async def search_sightings_with_image(
    search_request: SearchRequest,
    db: Session = Depends(get_db)
):
    """
    Search for dogs using photo(s) and/or description.

    - Provide base64-encoded photo(s) of the dog you're looking for (optional)
    - Provide text description (optional)
    - At least one of photo or description is required
    """
    try:
        if not search_request.images and not search_request.description:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Debes proporcionar al menos una foto o descripción"
            )

        images = None
        if search_request.images:
            print(f"🔍 Converting {len(search_request.images)} base64 images...")
            images = convert_base64_to_upload_files(search_request.images)

        print(f"🔍 Searching with {len(images) if images else 0} images and description")
        search_attrs = await extract_search_attributes(
            images=images,
            description=search_request.description
        )

        if not search_attrs:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se pudieron extraer atributos de búsqueda"
            )

        print(f"🔍 Search attributes: {search_attrs}")

        search_embedding = None
        if images:
            print("🔢 Generating search embedding from image...")
            search_embedding = await embedding_service.generate_embedding(search_request.images[0])
            if search_embedding is not None:
                print(f"✅ Search embedding generated")

        results = matching_service.find_matches_with_vectors(
            db=db,
            search_attributes=search_attrs,
            search_embedding=search_embedding,
            latitude=search_request.latitude,
            longitude=search_request.longitude,
            radius_km=search_request.radius,
            limit=search_request.limit
        )

        search_results = format_search_results(results)
        print(f"✅ Found {len(search_results)} matches")

        return SearchResponse(
            results=search_results,
            search_attributes=search_attrs,
            total_results=len(search_results)
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error searching: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error searching: {str(e)}"
        )


@app.get(
    "/api/sightings/{sighting_id}",
    response_model=DogSightingResponse,
    tags=["Sightings"]
)
async def get_sighting(sighting_id: str, db: Session = Depends(get_db)):
    """
    Get details of a specific dog sighting.
    """
    try:
        sighting = db.query(DogSighting).filter(
            DogSighting.id == uuid.UUID(sighting_id)
        ).first()
        
        if not sighting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sighting not found"
            )
        
        return DogSightingResponse.from_orm_model(sighting)
    
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid sighting ID format"
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error getting sighting: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting sighting: {str(e)}"
        )


@app.put(
    "/api/sightings/{sighting_id}/complete",
    response_model=DogSightingResponse,
    tags=["Sightings"]
)
async def complete_draft_sighting(
    sighting_id: str,
    completion: CompleteDraftRequest,
    db: Session = Depends(get_db)
):
    """
    Complete a draft sighting by adding location.

    - Adds location to a draft sighting
    - Changes status from 'draft' to 'active'
    - Returns the completed sighting
    """
    try:
        sighting = db.query(DogSighting).filter(
            DogSighting.id == uuid.UUID(sighting_id)
        ).first()

        if not sighting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sighting not found"
            )

        if sighting.status != "draft":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only draft sightings can be completed"
            )

        sighting.latitude = completion.latitude
        sighting.longitude = completion.longitude
        sighting.location_address = completion.location_address
        sighting.neighborhood = completion.neighborhood
        sighting.status = "active"

        db.commit()
        db.refresh(sighting)

        print(f"✅ Draft sighting {sighting_id} completed and activated")

        return DogSightingResponse.from_orm_model(sighting)

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid sighting ID format"
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error completing draft: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error completing draft: {str(e)}"
        )


@app.get(
    "/api/sightings/recent",
    response_model=DogSightingListResponse,
    tags=["Sightings"]
)
async def get_recent_sightings(
    limit: int = 20,
    offset: int = 0,
    neighborhood: Optional[str] = None,
    status_filter: str = "active",
    db: Session = Depends(get_db)
):
    """
    Get recent dog sightings (public feed).
    
    - Returns most recent sightings first
    - Optionally filter by neighborhood
    - Pagination with limit/offset
    """
    try:
        query = db.query(DogSighting).filter(
            DogSighting.status == status_filter
        )
        
        if neighborhood:
            query = query.filter(
                DogSighting.neighborhood.ilike(f"%{neighborhood}%")
            )

        total = query.count()
        sightings = query.order_by(
            DogSighting.created_at.desc()
        ).offset(offset).limit(limit).all()

        sighting_responses = [
            DogSightingResponse.from_orm_model(s) for s in sightings
        ]
        
        return DogSightingListResponse(
            sightings=sighting_responses,
            total=total,
            has_more=(offset + limit) < total
        )
    
    except Exception as e:
        print(f"❌ Error getting recent sightings: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting sightings: {str(e)}"
        )


# ============================================================================
# Map Endpoints
# ============================================================================

@app.get("/api/map/sightings", tags=["Map"])
async def get_map_sightings(db: Session = Depends(get_db)):
    """
    Get dog sightings optimized for map display.
    Returns minimal data: location, photo, and description.
    """
    try:
        sightings = db.query(DogSighting).filter(
            DogSighting.status == "active",
            DogSighting.latitude.isnot(None),
            DogSighting.longitude.isnot(None)
        ).all()

        sightings_data = [
            {
                "id": str(sighting.id),
                "latitude": sighting.latitude,
                "longitude": sighting.longitude,
                "photo": sighting.image_urls[0] if sighting.image_urls else None,
                "description": sighting.user_description or ", ".join(sighting.attributes[:3]) if sighting.attributes else "Perro encontrado",
                "timestamp": sighting.created_at
            }
            for sighting in sightings
        ]

        return {
            "sightings": sightings_data,
            "total": len(sightings_data)
        }

    except Exception as e:
        print(f"❌ Error getting map sightings: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting map sightings: {str(e)}"
        )


# ============================================================================
# Root Endpoint
# ============================================================================

@app.get("/", tags=["Root"])
async def root():
    """
    API root - returns basic info.
    """
    return {
        "name": "Lost Dogs Finder API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs" if settings.debug else "disabled in production",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug
    )