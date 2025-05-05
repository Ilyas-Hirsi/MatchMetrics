import requests
import pandas as pd
import time
from collections import OrderedDict


#  api key 
API_KEY = "RGAPI-719eae15-42a4-480d-bbc6-d0bbeb983e43"

# Setting API endpoints
REGION = "na1"
ACCOUNT_REGION = "americas"
RIOT_ID_ENDPOINT = f"https://{ACCOUNT_REGION}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/"

MATCHLIST_ENDPOINT = f"https://{ACCOUNT_REGION}.api.riotgames.com/lol/match/v5/matches/by-puuid/{{puuid}}/ids"

MATCH_ENDPOINT = "https://americas.api.riotgames.com/lol/match/v5/matches/{match_id}"
    

#defining the role that the winratse will be based off of
ROLE = "JUNGLE"

QUEUE_IDS = {
    "RANKED_SOLO" : 420,
    "RANKED_FLEX" : 440
}


# get_puuid(summoner_name) returns the puuid of a given summoner, based on their riotID and returns it in a json
# If an error occurs, the functions prints the error code to the terminal and returns None
def get_puuid(riot_id, tag):
    headers = {"X-Riot-Token": API_KEY}  # Pass API key in headers
    response = requests.get(f"{RIOT_ID_ENDPOINT}{riot_id}/{tag}/", headers=headers)
    
    if response.status_code == 200:
        return response.json()["puuid"]
    elif response.status_code == 403:
        print("❌ Forbidden: Check API key, rate limits, or permissions.")
    else:
        print(f"❌ Error getting PUUID: {response.status_code}")
    
    return None


def get_match_ids(puuid, count = 50):
    response = requests.get(MATCHLIST_ENDPOINT.format(puuid=puuid) + f"?count={count}&api_key={API_KEY}")
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error getting match IDs: {response.status_code}")
        return []

def get_role_winrate(puuid,match_ids = None):
    if not match_ids:
        return {}
    
    champ_wins = {}
    champ_games = {}

    for match_id in match_ids:
        match_data = requests.get(MATCH_ENDPOINT.format(match_id=match_id) + f"?api_key={API_KEY}").json()
        time.sleep(0.0001)

        if "info" not in match_data:
            continue
        
        match_players = match_data["info"]["participants"]

        player_data = next((p for p in match_players if p["puuid"] == puuid), None)

        if   not match_data["info"].get("queueId", -1) == QUEUE_IDS["RANKED_SOLO"]:
            continue


        if not player_data or player_data["teamPosition"] != ROLE.upper():
            continue # skip games where the player's role is not the inputted role

        # code to find enemy laner in game
        for player in match_players:
            if player["puuid"] != puuid and player["teamPosition"] == ROLE.upper():
                champ = player["championName"]
                won = not player["win"]
                #tracking total games against any given champ
                if champ in champ_games:
                    champ_games[champ] += 1
                else:
                    champ_games[champ] = 1
                #tracking total wins against any given champ
                if champ in champ_wins:
                    champ_wins[champ] +=int(won)
                else:
                    champ_wins[champ] = int(won)
    win_rates = {
            champ: (champ_wins[champ] / max(1,champ_games[champ]) * 100,
               champ_wins[champ]-champ_games[champ], champ_games[champ] )for champ in champ_games
        }
   
    # this code sorts winrates in increasing order by winrate, then by number of wins, then number of games
    sorted_wrs = OrderedDict(sorted(win_rates.items(), 
    key=lambda item: item[1]))  # Sorting by win rate and games played


    return sorted_wrs


# function takes in a puuid, and a list of match ids, and returns a dictionary
# that contains relevant player data such as KDA, totalMinionsKilled, etc.
# requires: puuid is not null
def get_match_stats(puuid,match_id):
    if not match_id:
        return []
    match_data = requests.get(MATCH_ENDPOINT.format(match_id=match_id) + f"?api_key={API_KEY}").json()
    if "info" not in match_data:
        return
    if match_data["info"].get("queueId", -1) != QUEUE_IDS["RANKED_SOLO"]:
        return
    

    team_kills = 0

    for player in match_data["info"]["participants"]:
        if player["puuid"] != puuid: continue

        game_time = player["timePlayed"] / 60

        total_cs = player["totalMinionsKilled"] + player["neutralMinionsKilled"]
        
        team_kills = sum(p["kills"] for p in match_data["info"]["participants"] if p["teamId"] == player["teamId"])
        if game_time < 3: continue

        return {"champion" : player["championName"],
                "kda" :  {"kills" : player["kills"], "deaths" : player["deaths"],
                          "assists" : player["assists"]},
                "cs_per_min" : total_cs / game_time,
                "gold_per_min" : player["goldEarned"] / game_time,
                "kill_participation" : (player["kills"] + player["assists"]) / max(1,team_kills),
                "damage_to_champs_per_min" : player["totalDamageDealtToChampions"]/ game_time
                }
    


riot_id = "ToxicTeem"
tag = "FFPLS"


puuid = get_puuid(riot_id, tag)

if puuid:
    match_ids = get_match_ids(puuid,100)
    if match_ids:
        game_stats = {}
        for match in match_ids:
            stats = get_match_stats(puuid, match)
            if stats: 
                game_stats[match] = get_match_stats(puuid, match)
                from upload import store_match_data
                
                print(game_stats[match])
                store_match_data(riot_id, tag,puuid, match)
        
        
        