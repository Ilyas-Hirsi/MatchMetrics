from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.utils.database import get_db
from app.models.user import User
from app.utils.auth import get_current_user
from app.services.matchup_analyzer import matchup_analyzer

router = APIRouter(prefix="/matchups", tags=["matchups"])


# Helper function to get user and validate match data
def _get_user_with_validation(db: Session, user_id: str):
    """Get user and check if they have match data available."""
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check for match data
    from app.models.match import Match
    match_count = db.query(Match).filter(Match.user_id == user.id).count()
    if match_count == 0:
        raise HTTPException(
            status_code=400, 
            detail="No match data available. Please refresh your data."
        )
    
    return user


@router.get("/difficult")
async def get_difficult_matchups(
    role: Optional[str] = Query(None, description="Filter by role (TOP, JUNGLE, MIDDLE, ADC, SUPPORT)"),
    game_mode: Optional[str] = Query(None, description="Filter by game mode (e.g., RANKED_SOLO_5x5, ARAM, NORMAL_DRAFT)"),
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's most difficult matchups - champions with win rate < 50%."""
    try:
        user = _get_user_with_validation(db, current_user)
        difficult_matchups = matchup_analyzer.analyze_difficult_matchups(db, user.id, role, game_mode)
        
        return {
            "difficult_matchups": difficult_matchups,
            "total_analyzed": len(difficult_matchups),
            "role_filter": role,
            "game_mode_filter": game_mode
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"🔍 ERROR: Difficult matchups error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze difficult matchups: {str(e)}")


@router.get("/champion/{champion_name}")
async def get_champion_matchup_data(
    champion_name: str,
    current_user: str = Depends(get_current_user)
):
    """Get general matchup data for a specific champion.
    
    Returns strong/weak matchups based on u.gg data.
    """
    # TODO: Replace with real u.gg scraper data
    return {
        "champion": champion_name,
        "strong_against": [
            {"champion": "WeakChamp1", "win_rate": 65.2},
            {"champion": "WeakChamp2", "win_rate": 62.8}
        ],
        "weak_against": [
            {"champion": "StrongChamp1", "win_rate": 35.1},
            {"champion": "StrongChamp2", "win_rate": 38.9}
        ]
    }


@router.get("/vs/{champion1}/{champion2}")
async def get_head_to_head_matchup(
    champion1: str,
    champion2: str,
    current_user: str = Depends(get_current_user)
):
    """Get detailed head-to-head matchup data between two champions."""
    matchup_data = matchup_analyzer.get_champion_matchup_data(champion1, champion2)
    
    return {
        "champion1": champion1,
        "champion2": champion2,
        "matchup_data": matchup_data
    }


@router.get("/details/{opponent}")
async def get_matchup_details(
    opponent: str,
    role: Optional[str] = Query(None, description="Filter by role (TOP, JUNGLE, MIDDLE, ADC, SUPPORT)"),
    game_mode: Optional[str] = Query(None, description="Filter by game mode (e.g., RANKED_SOLO_5x5, ARAM, NORMAL_DRAFT)"),
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive matchup details against a specific opponent.
    
    Returns detailed stats, distributions, and recent match history.
    """
    try:
        user = _get_user_with_validation(db, current_user)
        details = matchup_analyzer.analyze_matchup_details(db, user.id, opponent, role, game_mode)
        return details
    except HTTPException:
        raise
    except Exception as e:
        print(f"🔍 ERROR: Matchup details error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get matchup details: {str(e)}")
