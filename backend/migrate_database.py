#!/usr/bin/env python3
"""
Database migration script to add missing columns
Run this script to update the database schema
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.utils.database import engine, SessionLocal

def migrate_database():
    """Add missing columns to existing tables"""
    print("Starting database migration...")
    
    db = SessionLocal()
    try:
        # Add missing columns to matches table
        print("Adding queue_id and game_mode columns to matches table...")
        
        # Check if columns already exist
        result = db.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'matches' AND column_name IN ('queue_id', 'game_mode')
        """))
        existing_columns = [row[0] for row in result.fetchall()]
        
        if 'queue_id' not in existing_columns:
            db.execute(text("ALTER TABLE matches ADD COLUMN queue_id INTEGER"))
            print("Added queue_id column")
        else:
            print("queue_id column already exists")
            
        if 'game_mode' not in existing_columns:
            db.execute(text("ALTER TABLE matches ADD COLUMN game_mode VARCHAR(50)"))
            print("Added game_mode column")
        else:
            print("game_mode column already exists")
        
        # Update champion_mastery table
        print("Updating champion_mastery table...")
        
        # Check if last_updated column exists
        result = db.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'champion_mastery' AND column_name = 'last_updated'
        """))
        
        if not result.fetchall():
            # Rename updated_at to last_updated if it exists
            result = db.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'champion_mastery' AND column_name = 'updated_at'
            """))
            
            if result.fetchall():
                db.execute(text("ALTER TABLE champion_mastery RENAME COLUMN updated_at TO last_updated"))
                print("Renamed updated_at to last_updated")
            else:
                db.execute(text("ALTER TABLE champion_mastery ADD COLUMN last_updated TIMESTAMP WITH TIME ZONE"))
                print("Added last_updated column")
        else:
            print("last_updated column already exists")
        
        db.commit()
        print("Database migration completed successfully!")
        
    except Exception as e:
        print(f"Migration failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate_database()
