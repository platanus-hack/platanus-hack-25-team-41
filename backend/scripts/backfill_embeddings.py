"""
Backfill script to generate embeddings for existing dog sightings.
Run this after adding the image_embedding column to the database.
"""
import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from app.database import get_db
from app.models.dog_sighting import DogSighting
from app.services.embedding_service import embedding_service


async def backfill_embeddings():
    """Generate embeddings for all sightings without them."""

    db = next(get_db())

    try:
        sightings = db.query(DogSighting).filter(
            DogSighting.image_embedding.is_(None),
            DogSighting.status == "active"
        ).all()

        total = len(sightings)
        print(f"📊 Found {total} sightings without embeddings")

        if total == 0:
            print("✅ All sightings already have embeddings!")
            return

        success_count = 0
        error_count = 0

        for i, sighting in enumerate(sightings, 1):
            try:
                print(f"\n[{i}/{total}] Processing sighting {sighting.id}...")

                if not sighting.image_urls or len(sighting.image_urls) == 0:
                    print(f"  ⚠️  No images found, skipping")
                    continue

                image_url = sighting.image_urls[0]
                print(f"  🔢 Generating embedding from {image_url[:50]}...")

                embedding = await embedding_service.generate_embedding(image_url)

                if embedding:
                    sighting.image_embedding = embedding
                    db.commit()
                    success_count += 1
                    print(f"  ✅ Embedding generated ({len(embedding)} dimensions)")
                else:
                    error_count += 1
                    print(f"  ❌ Failed to generate embedding")

            except Exception as e:
                error_count += 1
                print(f"  ❌ Error: {e}")
                db.rollback()
                continue

        print(f"\n{'='*50}")
        print(f"✅ Backfill complete!")
        print(f"   Success: {success_count}")
        print(f"   Errors:  {error_count}")
        print(f"   Total:   {total}")

    except Exception as e:
        print(f"❌ Fatal error: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    print("🚀 Starting embedding backfill...\n")
    asyncio.run(backfill_embeddings())
