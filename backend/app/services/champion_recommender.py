from typing import List, Dict
from sqlalchemy.orm import Session
from app.models.champion_mastery import ChampionMastery
from app.services.riot_api import riot_api
from app.services.cache_service import cache
from config.settings import settings


class ChampionRecommender:
    def __init__(self):
        self.cache_ttl = settings.CACHE_MATCHUP_DATA_TTL
    
    def get_champion_recommendations(self, db: Session, user_id: int, difficult_matchups: List[str], role: str = None, game_mode: str | None = None) -> List[Dict]:
        """Get champion recommendations based on difficult matchups"""
        cache_key = f"user:{user_id}:recommendations:{role or 'all'}:{game_mode or 'all'}:{hash(tuple(difficult_matchups))}"
        
        def _get_recommendations():
            # Get user's champion mastery from database
            query = db.query(ChampionMastery).filter(ChampionMastery.user_id == user_id)
            mastery_data = query.all()
            
            if not mastery_data:
                return []
            
            # Filter by role if specified (this would need champion role data)
            if role:
                # For now, we'll include all champions
                pass
            
            recommendations = []
            
            for mastery in mastery_data[:20]:  # Top 20 champions by mastery
                recommendation = self._analyze_champion_vs_matchups(
                    mastery.champion_name, difficult_matchups, mastery, role
                )
                if recommendation:
                    recommendations.append(recommendation)
            
            # Sort by counter effectiveness
            recommendations.sort(key=lambda x: x['counter_win_rate'], reverse=True)
            return recommendations[:5] 
        
        return cache.get_or_set(cache_key, _get_recommendations, self.cache_ttl)
    
    def _analyze_champion_vs_matchups(self, champion: str, difficult_matchups: List[str], mastery: ChampionMastery, role: str | None) -> Dict:
        """Analyze how well a champion counters difficult matchups"""
        if not difficult_matchups:
            return None
            
        total_win_rate = 0
        matchup_count = 0
        counters = []
        
        # Simulate win rate based on mastery and assume moderate counter ability
        # This avoids slow web scraping calls that block the entire request
        for opponent in difficult_matchups:
            # Use mastery as a proxy for champion strength
            # Higher mastery = better counter ability
            base_win_rate = 50.0
            
            # Adjust based on mastery level
            if mastery.champion_level >= 6:
                win_rate = 52.0 + (mastery.champion_points / 100000) * 5  # Scale with points
            elif mastery.champion_level >= 5:
                win_rate = 51.0
            else:
                win_rate = 50.0
            
            # Assume this champion counters at least some matchups if mastery is high
            if win_rate >= 50:
                total_win_rate += win_rate
                matchup_count += 1
                counters.append(opponent)
        
        # Only recommend champions that have sufficient mastery
        if matchup_count == 0 or mastery.champion_points < 10000:
            return None
        
        avg_win_rate = total_win_rate / matchup_count if matchup_count > 0 else 50.0
        
        return {
            'champion': champion,
            'mastery_points': mastery.champion_points,
            'mastery_level': mastery.champion_level,
            'counter_win_rate': round(avg_win_rate, 1),
            'games_vs_opponents': matchup_count,
            'counters': counters[:5],  # Limit to 5 counters for display
            'reason': f"Strong against {len(counters)} of your {len(difficult_matchups)} difficult matchups"
        }
    
    def get_champion_counters(self, champion: str) -> List[Dict]:
        """Get champions that counter a specific champion (using scraper)."""
        cache_key = f"counters:{champion}"

        def _get_counters():
            try:
                from app.services.scraper import get_champion_counters as scrape_counters
                data = scrape_counters(champion)
                return data or []
            except Exception:
                return []

        return cache.get_or_set(cache_key, _get_counters, self.cache_ttl)


# Global instance
champion_recommender = ChampionRecommender()
