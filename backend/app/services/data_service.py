from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.models.user import User
from app.models.match import Match
from app.models.champion_mastery import ChampionMastery
from app.services.riot_api import riot_api
from app.services.cache_service import cache
from config.settings import settings

class DataService:
    def __init__(self):
        self.cache_ttl = settings.CACHE_MATCH_HISTORY_TTL
    
    def get_or_fetch_user_data(self, db: Session, user_id: int, force_refresh: bool = False) -> Dict:
        """Get user data from database, fetch from Riot API if needed"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return None
        
        cache_key = f"user:{user.puuid}:data"
        
        def _fetch_data():
            # Check if we need to fetch new data
            if not force_refresh and self._has_recent_data(db, user_id):
                return self._get_cached_data(db, user_id)
            
            # Fetch from Riot API
            return self._fetch_from_riot_api(db, user)
        
        return cache.get_or_set(cache_key, _fetch_data, self.cache_ttl)
    
    def _has_recent_data(self, db: Session, user_id: int) -> bool:
        """Check if user has recent match data (within last hour)"""
        recent_time = datetime.utcnow() - timedelta(hours=1)
        recent_match = db.query(Match).filter(
            Match.user_id == user_id,
            Match.created_at >= recent_time
        ).first()
        return recent_match is not None
    
    def _get_cached_data(self, db: Session, user_id: int) -> Dict:
        """Get data from database"""
        matches = db.query(Match).filter(Match.user_id == user_id).order_by(Match.game_creation.desc()).limit(200).all()
        mastery = db.query(ChampionMastery).filter(ChampionMastery.user_id == user_id).all()
        
        return {
            "matches": [self._format_match(match) for match in matches],
            "mastery": [self._format_mastery(m) for m in mastery]
        }
    
    def _fetch_from_riot_api(self, db: Session, user: User) -> Dict:
        """Fetch fresh data from Riot API and store in database"""
        # Get match history

        match_ids = []
        for i in range(2):
            match_ids.append(riot_api.get_match_history(user.puuid, count=100))
        
        # Process matches
        matches = []
        for match_id in match_ids:
            # Check if match already exists
            existing_match = db.query(Match).filter(Match.match_id == match_id).first()
            if existing_match:
                matches.append(self._format_match(existing_match))
                continue
            
            # Fetch new match data
            match_data = riot_api.get_match_details(match_id)
            if match_data:
                match_obj = self._process_match_data(db, user, match_id, match_data)
                if match_obj:
                    matches.append(self._format_match(match_obj))
        
        # Get champion mastery
        mastery_data = riot_api.get_champion_mastery(user.puuid)
        mastery = []
        for champ_data in mastery_data:
            mastery_obj = self._process_mastery_data(db, user, champ_data)
            if mastery_obj:
                mastery.append(self._format_mastery(mastery_obj))
        
        return {"matches": matches, "mastery": mastery}
    
    def _process_match_data(self, db: Session, user: User, match_id: str, match_data: Dict) -> Optional[Match]:
        """Process and store match data"""
        try:
            player_data = next(
                (p for p in match_data["info"]["participants"] if p["puuid"] == user.puuid),
                None
            )
            if not player_data:
                return None
            
            # Extract game mode info
            queue_id = match_data["info"]["queueId"]
            game_mode = self._get_game_mode(queue_id)
            
            # Create match object
            match_obj = Match(
                match_id=match_id,
                user_id=user.id,
                champion=player_data["championName"],
                opponent_champion=self._get_opponent_champion(match_data, player_data),
                team_position=player_data.get("teamPosition", "UNKNOWN"),
                win=player_data["win"],
                game_duration=match_data["info"]["gameDuration"] / 60,
                kills=player_data["kills"],
                deaths=player_data["deaths"],
                assists=player_data["assists"],
                cs_per_min=(player_data["totalMinionsKilled"] + player_data["neutralMinionsKilled"]) / (match_data["info"]["gameDuration"] / 60),
                gold_per_min=player_data["goldEarned"] / (match_data["info"]["gameDuration"] / 60),
                kill_participation=self._calculate_kill_participation(player_data, match_data),
                damage_to_champs_per_min=player_data["totalDamageDealtToChampions"] / (match_data["info"]["gameDuration"] / 60),
                game_creation=datetime.fromtimestamp(match_data["info"]["gameCreation"] / 1000),
                queue_id=queue_id,
                game_mode=game_mode
            )
            
            db.add(match_obj)
            db.commit()
            db.refresh(match_obj)
            return match_obj
            
        except Exception as e:
            print(f"Error processing match {match_id}: {e}")
            return None
    
    def _get_game_mode(self, queue_id: int) -> str:
        """Convert queue ID to game mode name"""
        queue_map = {
            420: "Ranked Solo/Duo",
            440: "Ranked Flex",
            450: "ARAM",
            700: "Clash",
            900: "URF",
            1020: "One for All",
            1300: "Nexus Blitz",
            1400: "Ultimate Spellbook",
            1700: "Arena",
            1900: "URF",
            2000: "Tutorial",
            2010: "Tutorial",
            2020: "Tutorial"
        }
        return queue_map.get(queue_id, f"Queue {queue_id}")
    
    def get_filtered_matches(self, db: Session, user_id: int, game_mode: Optional[str] = None, limit: int = 100) -> List[Dict]:
        """Get matches filtered by game mode"""
        query = db.query(Match).filter(Match.user_id == user_id)
        
        if game_mode:
            query = query.filter(Match.game_mode == game_mode)
        
        matches = query.order_by(Match.game_creation.desc()).limit(limit).all()
        return [self._format_match(match) for match in matches]
    
    def _format_match(self, match: Match) -> Dict:
        """Format match for API response"""
        return {
            "match_id": match.match_id,
            "champion": match.champion,
            "opponent_champion": match.opponent_champion,
            "team_position": match.team_position,
            "win": match.win,
            "game_duration": match.game_duration,
            "kda": {
                "kills": match.kills,
                "deaths": match.deaths,
                "assists": match.assists
            },
            "cs_per_min": match.cs_per_min,
            "gold_per_min": match.gold_per_min,
            "kill_participation": match.kill_participation,
            "damage_to_champs_per_min": match.damage_to_champs_per_min,
            "game_creation": match.game_creation.isoformat() if match.game_creation else None,
            "queue_id": getattr(match, 'queue_id', None),
            "game_mode": getattr(match, 'game_mode', 'Unknown')
        }
    
    def _format_mastery(self, mastery: ChampionMastery) -> Dict:
        """Format mastery for API response"""
        return {
            "champion_id": mastery.champion_id,
            "champion_name": mastery.champion_name,
            "champion_level": mastery.champion_level,
            "champion_points": mastery.champion_points,
            "last_played": mastery.last_played.isoformat() if mastery.last_played else None
        }

# Global instance
data_service = DataService()