from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.utils.database import Base


class Match(Base):
    __tablename__ = "matches"
    
    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(String(50), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Match details
    champion = Column(String(50), nullable=False)
    opponent_champion = Column(String(50), nullable=True)
    team_position = Column(String(20), nullable=False)
    win = Column(Boolean, nullable=False)
    game_duration = Column(Float, nullable=False)  # in minutes
    queue_id = Column(Integer, nullable=True)
    game_mode = Column(String(50), nullable=True)
    # Performance stats
    kills = Column(Integer, nullable=False)
    deaths = Column(Integer, nullable=False)
    assists = Column(Integer, nullable=False)
    cs_per_min = Column(Float, nullable=False)
    gold_per_min = Column(Float, nullable=False)
    kill_participation = Column(Float, nullable=False)
    damage_to_champs_per_min = Column(Float, nullable=False)
    
    # Game mode and queue info
    queue_id = Column(Integer, nullable=True)
    game_mode = Column(String(50), nullable=True)
    
    # Timestamps
    game_creation = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="matches")
    
    def __repr__(self):
        return f"<Match(match_id='{self.match_id}', champion='{self.champion}', win={self.win})>"
