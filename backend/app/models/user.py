from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.utils.database import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    riot_id = Column(String(50), nullable=False, index=True)
    tag = Column(String(10), nullable=False)
    puuid = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=True, default='', server_default='')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_updated = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    matches = relationship("Match", back_populates="user")
    champion_mastery = relationship("ChampionMastery", back_populates="user")
    
    def __repr__(self):
        return f"<User(riot_id='{self.riot_id}', tag='{self.tag}')>"
