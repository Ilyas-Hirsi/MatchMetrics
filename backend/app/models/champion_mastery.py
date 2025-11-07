from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.utils.database import Base


class ChampionMastery(Base):
    __tablename__ = "champion_mastery"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    champion_id = Column(Integer, nullable=False)
    champion_name = Column(String(50), nullable=False)
    champion_level = Column(Integer, nullable=False)
    champion_points = Column(Integer, nullable=False)
    last_played = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_updated = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="champion_mastery")
    
    def __repr__(self):
        return f"<ChampionMastery(champion='{self.champion_name}', level={self.champion_level}, points={self.champion_points})>"
