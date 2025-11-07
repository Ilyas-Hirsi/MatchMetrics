import requests
import time
from typing import List, Dict, Optional
from config.settings import settings


class RiotAPIService:
    def __init__(self):
        self.api_key = settings.RIOT_API_KEY
        self.region = settings.RIOT_API_REGION
        self.account_region = settings.RIOT_API_ACCOUNT_REGION
        self.base_url = f"https://{self.region}.api.riotgames.com"
        self.account_url = f"https://{self.account_region}.api.riotgames.com"
        self.rate_limit_per_second = settings.RIOT_API_RATE_LIMIT_PER_SECOND
        self.rate_limit_per_two_minutes = settings.RIOT_API_RATE_LIMIT_PER_TWO_MINUTES
        self.last_request_time = 0
        self.request_count = 0
        self.two_minute_window_start = time.time()
    
    def _rate_limit(self):
        """Implement rate limiting for Riot API"""
        current_time = time.time()
        
        # Reset two-minute window if needed
        if current_time - self.two_minute_window_start >= 120:
            self.two_minute_window_start = current_time
            self.request_count = 0
        
        # Check two-minute limit
        if self.request_count >= self.rate_limit_per_two_minutes:
            sleep_time = 120 - (current_time - self.two_minute_window_start)
            if sleep_time > 0:
                time.sleep(sleep_time)
                self.two_minute_window_start = time.time()
                self.request_count = 0
        
        # Check per-second limit
        time_since_last = current_time - self.last_request_time
        if time_since_last < (1.0 / self.rate_limit_per_second):
            time.sleep((1.0 / self.rate_limit_per_second) - time_since_last)
        
        self.last_request_time = time.time()
        self.request_count += 1
    
    def _make_request(self, url: str, params: Dict = None) -> Optional[Dict]:
        """Make a rate-limited request to Riot API"""
        self._rate_limit()
        
        headers = {"X-Riot-Token": self.api_key}
        try:
            response = requests.get(url, headers=headers, params=params)
            
            if response.status_code == 200:
                print(response.status_code)
                return response.json()
            if response.status_code == 209:
                print(response.status_code)
                return response.json()
            elif response.status_code == 404:
                print(response.status_code)
                return None
            elif response.status_code == 403:
                print(" Forbidden: Check API key, rate limits, or permissions.")
                print(response.status_code)
                return None
            elif response.status_code == 429:
                print(" Rate limit exceeded, waiting...")
                time.sleep(60)  # Wait 1 minute for rate limit reset
                return self._make_request(url, params)
            else:
                print(f" API Error: {response.status_code} - {response.text}")
                return None
        except Exception as e:
            print(f" Request failed: {e}")
            return None
    
    def get_puuid(self, riot_id: str, tag: str) -> Optional[str]:
        """Get PUUID from Riot ID and tag"""
        url = f"{self.account_url}/riot/account/v1/accounts/by-riot-id/{riot_id}/{tag}/"
        data = self._make_request(url)
        if data:
            return data.get("puuid")
        else:
            print("Api call failed (Getting PUUID)")
            return None
    
    def get_summoner_by_puuid(self, puuid: str) -> Optional[Dict]:
        """Get summoner data by PUUID"""
        url = f"{self.base_url}/lol/summoner/v4/summoners/by-puuid/{puuid}"
        return self._make_request(url)
    
    def get_match_history(self, puuid: str, count: int = 100, start: int = 0, queue: Optional[int] = None) -> List[str]:
        """Get match history for a player"""
        url = f"{self.account_url}/lol/match/v5/matches/by-puuid/{puuid}/ids"
        params: Dict = {"count": count, "start": start}
        if queue is not None:
            params["queue"] = queue
        return self._make_request(url, params) or []
    
    def get_match_details(self, match_id: str) -> Optional[Dict]:
        """Get detailed match information"""
        url = f"{self.account_url}/lol/match/v5/matches/{match_id}"
        return self._make_request(url)
    
    def get_champion_mastery(self, puuid: str) -> List[Dict]:
        """Get champion mastery data"""
        url = f"{self.base_url}/lol/champion-mastery/v4/champion-masteries/by-puuid/{puuid}"
        return self._make_request(url) or []
    
    def get_ranked_stats(self, summoner_id: str) -> List[Dict]:
        """Get ranked statistics"""
        url = f"{self.base_url}/lol/league/v4/entries/by-summoner/{summoner_id}"
        return self._make_request(url) or []


# Global instance
riot_api = RiotAPIService()
