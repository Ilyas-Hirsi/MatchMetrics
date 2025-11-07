from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
import json
from app.utils.database import get_db
from app.models.user import User
from app.utils.auth import get_current_user
from app.services.champion_recommender import champion_recommender
from app.services.matchup_analyzer import matchup_analyzer

router = APIRouter(prefix="/champions", tags=["champions"])


@router.get("/recommendations")
async def get_champion_recommendations(
    role: Optional[str] = Query(None, description="Filter by role"),
    game_mode: Optional[str] = Query(None, description="Filter by game mode"),
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get champion recommendations based on difficult matchups"""
    try:
        user = db.query(User).filter(User.id == int(current_user)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Ensure user has match data
        from app.models.match import Match
        match_count = db.query(Match).filter(Match.user_id == user.id).count()
        if match_count == 0:
            return {
                "recommendations": [],
                "based_on_matchups": [],
                "role_filter": role,
                "message": "No match data available. Please refresh your data."
            }
        
        # Get difficult matchups first
        difficult_matchups = matchup_analyzer.analyze_difficult_matchups(db, user.id, role, game_mode)
        difficult_champions = [m["champion"] for m in difficult_matchups]
        
        # Get recommendations
        recommendations = champion_recommender.get_champion_recommendations(
            db, user.id, difficult_champions, role, game_mode
        )
        
        return {
            "recommendations": recommendations,
            "based_on_matchups": difficult_champions,
            "role_filter": role,
            "game_mode_filter": game_mode
        }
        
    except Exception as e:
        print(f"🔍 ERROR: Champion recommendations error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get champion recommendations: {str(e)}")


@router.get("/counters/{champion_name}")
async def get_champion_counters(
    champion_name: str,
    current_user: str = Depends(get_current_user)
):
    """Get champions that counter a specific champion"""
    counters = champion_recommender.get_champion_counters(champion_name)
    
    return {
        "champion": champion_name,
        "counters": counters
    }


@router.get("/stats/{champion_name}")
async def get_champion_stats(
    champion_name: str,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive champion stats from u.gg scraper"""
    try:
        from app.utils.redis_client import redis_client
        
        cache_key = f"champion_stats:{champion_name.lower()}"
        cached_data = redis_client.get(cache_key)
        
        if cached_data:
            data = json.loads(cached_data)
            if data.get('win_rate') == 50.0 and data.get('pick_rate') == 0.0:
                redis_client.delete(cache_key)
            else:
                return data
        
        from app.services.scraper import get_champion_data
        champion_data = get_champion_data(champion_name)
        
        if champion_data:
            result = {
                "champion": champion_name,
                "win_rate": round(champion_data.get('win_rate', 50.0), 2),
                "pick_rate": round(champion_data.get('pick_rate', 0.0), 2),
                "ban_rate": round(champion_data.get('ban_rate', 0.0), 2),
                "counters": champion_data.get('counters', []),
                "strong_against": champion_data.get('strong_against', []),
                "weak_against": champion_data.get('weak_against', [])
            }
            
            redis_client.setex(cache_key, 86400, json.dumps(result))
            return result
        else:
            # Fallback to basic counter data
            from app.services.scraper import get_champion_counters
            counters = get_champion_counters(champion_name)
            
            result = {
                "champion": champion_name,
                "win_rate": 50.0,
                "pick_rate": 0.0,
                "ban_rate": 0.0,
                "counters": counters if counters else [],
                "strong_against": [],
                "weak_against": []
            }
            
            # Even cache the fallback (with shorter TTL - 1 hour)
            if counters:
                redis_client.setex(cache_key, 3600, json.dumps(result))
            
            return result
    except Exception as e:
        return {
            "champion": champion_name,
            "win_rate": 50.0,
            "pick_rate": 0.0,
            "ban_rate": 0.0,
            "counters": [],
            "strong_against": [],
            "weak_against": []
        }
