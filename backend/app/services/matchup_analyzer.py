from typing import List, Dict
from collections import defaultdict
from sqlalchemy.orm import Session
from sqlalchemy import Integer
from app.models.match import Match
from app.services.cache_service import cache
from config.settings import settings


class MatchupAnalyzer:
    """Analyzes player matchups to identify difficult opponents and provide insights."""
    
    def __init__(self):
        self.cache_ttl = settings.CACHE_MATCHUP_DATA_TTL
    
    def analyze_difficult_matchups(self, db: Session, user_id: int, role: str = None, game_mode: str | None = None) -> List[Dict]:
        """Find champions that give the player the most trouble.
        
        Returns matchups with win rate < 50% sorted by difficulty.
        """
        normalized_role = self._normalize_role(role) if role else None
        normalized_mode = (game_mode or '').strip() or None
        cache_key = f"user:{user_id}:difficult_matchups:{normalized_role or 'all'}:{normalized_mode or 'all'}"
        
        def _analyze():
            # Use database aggregation for much faster processing
            from sqlalchemy import func
            
            # Build base query with filters
            query = db.query(
                Match.opponent_champion,
                func.count(Match.id).label('games'),
                func.sum(func.cast(Match.win, Integer)).label('wins'),
                func.avg(Match.kills).label('avg_kills'),
                func.avg(Match.deaths).label('avg_deaths'),
                func.avg(Match.assists).label('avg_assists'),
                func.avg(Match.cs_per_min).label('avg_cs_per_min'),
                func.avg(Match.damage_to_champs_per_min).label('avg_damage_per_min')
            ).filter(
                Match.user_id == user_id,
                Match.opponent_champion.isnot(None)  # Only matches with opponent data
            )
            
            if normalized_role:
                query = query.filter(Match.team_position == normalized_role)
            if normalized_mode:
                query = query.filter(Match.game_mode == normalized_mode)
            
            # Group by opponent champion
            results = query.group_by(Match.opponent_champion).having(
                func.count(Match.id) >= 3  # At least 3 games
            ).all()
            
            if not results:
                return []
            
            # Process database results
            difficult_matchups = []
            for row in results:
                opponent = row.opponent_champion
                games = row.games
                wins = row.wins or 0
                
                win_rate = (wins / games) * 100
                if win_rate >= 50:  # Skip matchups we're winning
                    continue
                
                difficult_matchups.append({
                    'champion': opponent,
                    'games_played': games,
                    'wins': wins,
                    'losses': games - wins,
                    'win_rate': round(win_rate, 1),
                    'avg_kda': {
                        'kills': round(row.avg_kills or 0, 1),
                        'deaths': round(row.avg_deaths or 0, 1),
                        'assists': round(row.avg_assists or 0, 1)
                    },
                    'avg_cs_per_min': round(row.avg_cs_per_min or 0, 1),
                    'avg_damage_per_min': round(row.avg_damage_per_min or 0, 1)
                })
            
            # Sort by difficulty: worst win rate first, then by sample size
            difficult_matchups.sort(key=lambda x: (x['win_rate'], -x['games_played']))
            return difficult_matchups[:10]  # Return top 10 toughest matchups
        
        return cache.get_or_set(cache_key, _analyze, self.cache_ttl)
    
    def _normalize_role(self, role: str) -> str | None:
        """Convert UI role names to Riot's teamPosition format."""
        if not role:
            return None
        
        role_upper = role.strip().upper()
        role_mapping = {
            'TOP': 'TOP',
            'JUNGLE': 'JUNGLE',
            'MID': 'MIDDLE',
            'MIDDLE': 'MIDDLE',
            'ADC': 'BOTTOM',
            'BOT': 'BOTTOM',
            'BOTTOM': 'BOTTOM',
            'SUPPORT': 'UTILITY',
            'UTILITY': 'UTILITY',
        }
        return role_mapping.get(role_upper, role_upper)

    
    def analyze_matchup_details(self, db: Session, user_id: int, opponent_champion: str, role: str | None = None, game_mode: str | None = None) -> Dict:
        """Get comprehensive stats for a specific opponent champion.
        
        Similar to u.gg's detailed matchup view - shows performance breakdown,
        role/mode distributions, and recent match history.
        """
        normalized_role = self._normalize_role(role) if role else None
        normalized_mode = (game_mode or '').strip() or None
        cache_key = f"user:{user_id}:matchup_details:{opponent_champion}:{normalized_role or 'all'}:{normalized_mode or 'all'}"

        def _compute():
            # Query matches against this specific opponent
            query = db.query(Match).filter(
                Match.user_id == user_id,
                Match.opponent_champion == opponent_champion
            )
            if normalized_role:
                query = query.filter(Match.team_position == normalized_role)
            if normalized_mode:
                query = query.filter(Match.game_mode == normalized_mode)

            matches = query.order_by(Match.game_creation.desc()).all()
            if not matches:
                return {
                    'opponent': opponent_champion,
                    'games': 0,
                    'wins': 0,
                    'losses': 0,
                    'win_rate': 0.0,
                    'avg_kda': {'kills': 0.0, 'deaths': 0.0, 'assists': 0.0},
                    'avg_cs_per_min': 0.0,
                    'avg_gold_per_min': 0.0,
                    'avg_damage_per_min': 0.0,
                    'avg_game_duration_min': 0.0,
                    'role_distribution': {},
                    'game_mode_distribution': {},
                    'recent_matches': []
                }

            # Calculate aggregate statistics
            total_games = len(matches)
            total_wins = sum(1 for m in matches if m.win)
            
            totals = {
                'kills': sum(m.kills for m in matches),
                'deaths': sum(m.deaths for m in matches),
                'assists': sum(m.assists for m in matches),
                'cs_per_min': sum(m.cs_per_min for m in matches),
                'gold_per_min': sum(m.gold_per_min for m in matches),
                'damage_to_champs_per_min': sum(m.damage_to_champs_per_min for m in matches),
                'game_duration_min': sum(m.game_duration for m in matches),
            }

            # Count role and game mode distributions
            role_dist: Dict[str, int] = {}
            mode_dist: Dict[str, int] = {}
            for m in matches:
                role_key = m.team_position or 'UNKNOWN'
                role_dist[role_key] = role_dist.get(role_key, 0) + 1
                mode_key = m.game_mode or 'UNKNOWN'
                mode_dist[mode_key] = mode_dist.get(mode_key, 0) + 1

            # Build recent matches list
            recent = []
            for m in matches[:10]:
                recent.append({
                    'match_id': m.match_id,
                    'date': m.game_creation.isoformat() if m.game_creation else None,
                    'champion': m.champion,
                    'opponent_champion': m.opponent_champion,
                    'win': bool(m.win),
                    'kda': {'kills': m.kills, 'deaths': m.deaths, 'assists': m.assists},
                    'cs_per_min': round(m.cs_per_min, 2),
                    'gold_per_min': round(m.gold_per_min, 2),
                    'damage_to_champs_per_min': round(m.damage_to_champs_per_min, 0),
                    'game_duration_min': round(m.game_duration, 1),
                    'role': m.team_position,
                    'game_mode': m.game_mode,
                })

            return {
                'opponent': opponent_champion,
                'games': total_games,
                'wins': total_wins,
                'losses': total_games - total_wins,
                'win_rate': round((total_wins / total_games) * 100, 1),
                'avg_kda': {
                    'kills': round(totals['kills'] / total_games, 1),
                    'deaths': round(totals['deaths'] / total_games, 1),
                    'assists': round(totals['assists'] / total_games, 1),
                },
                'avg_cs_per_min': round(totals['cs_per_min'] / total_games, 2),
                'avg_gold_per_min': round(totals['gold_per_min'] / total_games, 0),
                'avg_damage_per_min': round(totals['damage_to_champs_per_min'] / total_games, 0),
                'avg_game_duration_min': round(totals['game_duration_min'] / total_games, 1),
                'role_distribution': role_dist,
                'game_mode_distribution': mode_dist,
                'recent_matches': recent,
            }

        return cache.get_or_set(cache_key, _compute, self.cache_ttl)


    
    def get_champion_matchup_data(self, champion: str, opponent: str) -> Dict:
        """Fetch matchup data between two champions from u.gg.
        
        Returns win rate and confidence level based on sample size.
        """
        cache_key = f"matchup:{champion}:{opponent}"
        
        def _get_matchup():
            try:
                from app.services.scraper import get_champion_counters
                counters = get_champion_counters(champion)
                
                # Find the specific opponent in counter data
                for counter in counters:
                    if counter.get('champion', '').lower() == opponent.lower():
                        games = counter.get('games', 0)
                        return {
                            'champion': champion,
                            'opponent': opponent,
                            'win_rate': counter.get('win_rate', 0),
                            'games_analyzed': games,
                            'confidence': 'high' if games > 100 else 'medium'
                        }
            except Exception:
                pass
            return None
        
        return cache.get_or_set(cache_key, _get_matchup, self.cache_ttl)


# Singleton instance for use across the application
matchup_analyzer = MatchupAnalyzer()
