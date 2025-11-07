import requests
from typing import Dict, Optional


class ChampionDataService:
    def __init__(self):
        self.version: Optional[str] = None
        self.id_to_name: Dict[int, str] = {}

    def _ensure_loaded(self):
        if self.id_to_name:
            return
        # Fetch latest version
        try:
            versions = requests.get("https://ddragon.leagueoflegends.com/api/versions.json", timeout=10).json()
            self.version = versions[0]
        except Exception:
            # Fallback to a known good version if network fails
            self.version = self.version or "13.24.1"

        # Fetch champion data for the selected version
        try:
            data = requests.get(
                f"https://ddragon.leagueoflegends.com/cdn/{self.version}/data/en_US/champion.json",
                timeout=15,
            ).json()
            # champion.json maps by champion name; each item has a string key "key" which is numeric ID
            mapping: Dict[int, str] = {}
            for champ in data.get("data", {}).values():
                try:
                    champ_id = int(champ.get("key"))
                    champ_name = champ.get("name")
                    if champ_id and champ_name:
                        mapping[champ_id] = champ_name
                except Exception:
                    continue
            if mapping:
                self.id_to_name = mapping
        except Exception:
            # leave mapping empty on failure
            pass

    def get_champion_name_by_id(self, champion_id: int) -> str:
        self._ensure_loaded()
        return self.id_to_name.get(champion_id, f"Champion {champion_id}")
    
    def get_champion_image_url(self, champion_name: str) -> str:
        """Get champion image URL from Data Dragon CDN"""
        self._ensure_loaded()
        # Normalize champion name for Data Dragon (e.g., "AurelionSol" -> "AurelionSol")
        # Data Dragon uses champion IDs (keys), need to find the key for the name
        try:
            data = requests.get(
                f"https://ddragon.leagueoflegends.com/cdn/{self.version}/data/en_US/champion.json",
                timeout=15,
            ).json()
            
            for champ_key, champ_data in data.get("data", {}).items():
                if champ_data.get("name") == champion_name:
                    return f"https://ddragon.leagueoflegends.com/cdn/{self.version}/img/champion/{champ_key}.png"
        except Exception:
            pass
        
        # Fallback: try with the name directly (works for most champions)
        return f"https://ddragon.leagueoflegends.com/cdn/{self.version}/img/champion/{champion_name}.png"


champion_data = ChampionDataService()


