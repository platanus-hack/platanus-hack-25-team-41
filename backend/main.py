"""
Lost Dogs Finder - FastAPI Backend
Main application with all endpoints.
"""
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
import uuid

from app.config import settings
from app.database import get_db, init_db
from app.models.dog_sighting import DogSighting
from app.models.reunion_report import ReunionReport
from app.schemas.dog_sighting import (
    DogSightingCreate,
    DogSightingResponse,
    DogSightingSearchResult,
    DogSightingListResponse,
)
from app.schemas.search import SearchResponse, ReunionReportCreate, ReunionReportResponse
from app.services.storage_service import storage_service
from app.services.llm_service import dog_description, extract_search_attributes
from app.services.matching_service import matching_service


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
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "healthy" if db_status == "connected" else "unhealthy",
        "database": db_status,
        "gcs": "connected",
        "llm": "dummy",
        "environment": settings.environment,
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
    images: List[UploadFile] = File(..., description="1-3 images of the dog"),
    description: Optional[str] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    location_address: Optional[str] = Form(None),
    neighborhood: Optional[str] = Form(None),
    contact_name: Optional[str] = Form(None),
    contact_phone: Optional[str] = Form(None),
    contact_email: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Create a new dog sighting report.
    
    - Upload 1-3 images of the found dog (required)
    - Optionally provide description and location
    - LLM automatically extracts dog attributes
    """
    try:
        if not images or len(images) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one image is required"
            )
        
        if len(images) > settings.max_images_per_sighting:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Maximum {settings.max_images_per_sighting} images allowed"
            )

        print(f"📤 Uploading {len(images)} images to GCS...")
        image_urls = await storage_service.upload_multiple_images(images)
        print(f"✅ Images uploaded: {image_urls}")

        print("🤖 Extracting dog attributes with LLM...")
        llm_result = await dog_description(images, description)

        if not llm_result or llm_result.get("es_perro") == False:
            for url in image_urls:
                await storage_service.delete_image(url)
            
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Las imágenes no parecen mostrar un perro. Por favor, sube imágenes claras de un perro."
            )
        
        attributes = llm_result.get("atributos", [])
        print(f"✅ Extracted attributes: {attributes}")

        new_sighting = DogSighting(
            image_urls=image_urls,
            user_description=description,
            attributes=attributes,
            latitude=latitude,
            longitude=longitude,
            location_address=location_address,
            neighborhood=neighborhood,
            contact_name=contact_name,
            contact_phone=contact_phone,
            contact_email=contact_email,
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

        results = matching_service.find_matches(
            db=db,
            search_attributes=search_attrs,
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
    images: Optional[List[UploadFile]] = File(None),
    description: Optional[str] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    radius: Optional[int] = Form(None),
    limit: int = Form(20),
    db: Session = Depends(get_db)
):
    """
    Search for dogs using photo(s) and/or description.
    
    - Upload photo(s) of the dog you're looking for (optional)
    - Provide text description (optional)
    - At least one of photo or description is required
    """
    try:
        if not images and not description:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Debes proporcionar al menos una foto o descripción"
            )

        print(f"🔍 Searching with {len(images) if images else 0} images and description")
        search_attrs = await extract_search_attributes(
            images=images,
            description=description
        )

        if not search_attrs:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se pudieron extraer atributos de búsqueda"
            )

        print(f"🔍 Search attributes: {search_attrs}")

        results = matching_service.find_matches(
            db=db,
            search_attributes=search_attrs,
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
# Reunion Report Endpoints
# ============================================================================

@app.post(
    "/api/reunions",
    response_model=ReunionReportResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Reunions"]
)
async def create_reunion_report(
    dog_sighting_id: str = Form(...),
    verification_image: UploadFile = File(...),
    message: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Report that you found your dog through the platform.
    
    - Provide the ID of the sighting that matches your dog
    - Upload a verification photo of you with the dog
    - Optional message
    
    This will be manually validated by admins.
    """
    try:
        sighting = db.query(DogSighting).filter(
            DogSighting.id == uuid.UUID(dog_sighting_id)
        ).first()

        if not sighting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sighting not found"
            )

        print(f"📤 Uploading verification image...")
        verification_url = await storage_service.upload_image(verification_image)
        print(f"✅ Verification image uploaded: {verification_url}")

        report = ReunionReport(
            dog_sighting_id=uuid.UUID(dog_sighting_id),
            verification_image_url=verification_url,
            user_message=message,
            status="pending"
        )
        
        db.add(report)
        db.commit()
        db.refresh(report)
        
        print(f"✅ Reunion report created with ID: {report.id}")
        
        return ReunionReportResponse(
            id=str(report.id),
            status=report.status,
            message="Tu reporte ha sido enviado. Lo revisaremos pronto y te contactaremos."
        )
    
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid sighting ID format"
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error creating reunion report: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating report: {str(e)}"
        )


# ============================================================================
# Map Endpoints
# ============================================================================

@app.get("/api/map/sightings", tags=["Map"])
async def get_map_sightings():
    """
    Get dog sightings optimized for map display.
    Returns minimal data: location, photo, and description.
    """
    return {
        "sightings": [
            {
                "id": "1",
                "latitude": -33.4489,
                "longitude": -70.6693,
                "photo": "https://images.unsplash.com/photo-1587300003388-59208cc962cb",
                "description": "Perro labrador color café, collar rojo",
            },
            {
                "id": "2",
                "latitude": -33.4372,
                "longitude": -70.6506,
                "photo": "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e",
                "description": "Pastor alemán, sin collar",
            },
            {
                "id": "3",
                "latitude": -33.4569,
                "longitude": -70.6483,
                "photo": "https://images.unsplash.com/photo-1558788353-f76d92427f16",
                "description": "Golden retriever cachorro",
            }
        ],
        "total": 3
    }


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