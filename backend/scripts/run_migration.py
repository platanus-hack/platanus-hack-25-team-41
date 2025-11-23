"""
Run database migration to add pgvector extension and column.
"""
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from app.database import get_db
from sqlalchemy import text


def run_migration():
    """Run the pgvector migration."""

    db = next(get_db())

    try:
        print("🚀 Running pgvector migration...\n")

        print("Step 1: Enabling pgvector extension...")
        db.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        db.commit()
        print("✅ pgvector extension enabled\n")

        print("Step 2: Adding image_embedding column...")
        db.execute(text("""
            ALTER TABLE dog_sightings
            ADD COLUMN IF NOT EXISTS image_embedding vector(1408)
        """))
        db.commit()
        print("✅ image_embedding column added\n")

        print("Step 3: Creating vector index...")
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS dog_sightings_embedding_idx
            ON dog_sightings
            USING ivfflat (image_embedding vector_cosine_ops)
            WITH (lists = 100)
        """))
        db.commit()
        print("✅ Vector index created\n")

        print("="*50)
        print("✅ Migration completed successfully!")

    except Exception as e:
        print(f"❌ Migration failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run_migration()
