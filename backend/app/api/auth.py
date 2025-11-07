from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from app.utils.database import get_db
from app.models.user import User
from app.utils.auth import create_access_token
from app.services.riot_api import riot_api
from config.settings import settings
from datetime import timedelta
from pydantic import BaseModel
from datetime import datetime  #
router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer()


class UserLogin(BaseModel):
    riot_id: str
    tag: str

class UserResponse(BaseModel):
    id: int
    riot_id: str
    tag: str
    puuid: str
    created_at: datetime
    last_updated: datetime | None = None

    class Config:
        from_attributes = True


@router.post("/login")
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """Login user and return access token"""
    # Get PUUID from Riot API
    puuid = riot_api.get_puuid(user_data.riot_id, user_data.tag)
    if not puuid:
        raise HTTPException(status_code=400, detail="Invalid Riot ID or Tag")
    
    # Find or create user in database (no signup step)
    user = db.query(User).filter(User.puuid == puuid).first()
    if not user:
        try:
            user = User(riot_id=user_data.riot_id, tag=user_data.tag, puuid=puuid, hashed_password='')
            db.add(user)
            db.commit()
            db.refresh(user)
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )

    # Return token payload expected by frontend
    return {"access_token": access_token, "token_type": "bearer"}
