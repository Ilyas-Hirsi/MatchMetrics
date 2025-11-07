import json
from typing import Any, Optional
from app.utils.database import get_redis


class CacheService:
    def __init__(self):
        self.redis_client = get_redis()
        self.enabled = self.redis_client is not None
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if not self.enabled:
            return None
        
        try:
            value = self.redis_client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            print(f"Cache get error: {e}")
            return None
    
    def set(self, key: str, value: Any, ttl: int = 3600) -> bool:
        """Set value in cache with TTL"""
        if not self.enabled:
            return False
        
        try:
            serialized_value = json.dumps(value)
            return self.redis_client.setex(key, ttl, serialized_value)
        except Exception as e:
            print(f"Cache set error: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        """Delete key from cache"""
        if not self.enabled:
            return False
        
        try:
            return bool(self.redis_client.delete(key))
        except Exception as e:
            print(f"Cache delete error: {e}")
            return False
    
    def get_or_set(self, key: str, func, ttl: int = 3600) -> Any:
        """Get from cache or set using function"""
        cached_value = self.get(key)
        if cached_value is not None:
            return cached_value
        
        value = func()
        if value is not None:
            self.set(key, value, ttl)
        return value
    
    def clear_user_cache(self, puuid: str):
        """Clear all cache entries for a user"""
        if not self.enabled:
            return
        
        try:
            pattern = f"user:{puuid}:*"
            keys = self.redis_client.keys(pattern)
            if keys:
                self.redis_client.delete(*keys)
        except Exception as e:
            print(f"Cache clear error: {e}")


# Global instance
cache = CacheService()
