from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.utils.database import Base


class MatchupStats(Base):
    __tablename__ = "matchup_stats"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    champion = Column(String(50), nullable=False)
    opponent_champion = Column(String(50), nullable=False)
    team_position = Column(String(20), nullable=False)
    
    # Statistics
    games_played = Column(Integer, nullable=False)
    wins = Column(Integer, nullable=False)
    losses = Column(Integer, nullable=False)
    win_rate = Column(Float, nullable=False)
    
    # Average performance
    avg_kills = Column(Float, nullable=False)
    avg_deaths = Column(Float, nullable=False)
    avg_assists = Column(Float, nullable=False)
    avg_cs_per_min = Column(Float, nullable=False)
    avg_damage_per_min = Column(Float, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<MatchupStats(champion='{self.champion}', vs='{self.opponent_champion}', win_rate={self.win_rate}%)>"
