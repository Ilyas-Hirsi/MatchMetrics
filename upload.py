from pymongo import MongoClient


# Connecting to MongoDB
client = MongoClient("mongodb+srv://ilyashirsi21:finizen2000@cluster0.q8ol1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")

db = client["league_data"]
players_collection = db["player_stats"]

def store_match_data(riot_id, tag, puuid, match_id):
    from main import get_match_stats
    match_entry = get_match_stats(puuid, match_id)

    if not match_entry:  # If match_entry is None or empty, skip update
        print(f" No match data for {match_id}. Skipping...")
        return

    if players_collection.find_one({ "puuid": puuid, 
                                     "matches": {"$elemMatch": {"match_id": match_id}}}):
        print(f"⚠️ Match {match_id} already exists. Skipping...")
        return

    player = players_collection.find_one({"puuid": puuid})

    if player:
        update_result = players_collection.update_one(
            {"puuid": puuid},
            {"$push": {"matches": match_entry}}
    )
        if update_result.modified_count > 0:
            print(f"✅ Match {match_id} successfully stored!")
        else:
            print(f"❌ No changes made for match {match_id}")
    else:
        new_player = {
            "SummonerName" : riot_id + "#" + tag,
            "puuid": puuid,
            "matches": [match_entry],
            "averages": {},
            "std_dev": {}
        }
        insert_result = players_collection.insert_one(new_player)
        if insert_result.inserted_id:
            print(f"✅ Match {match_id} successfully stored!")
        else:
            print(f"❌ MongoDB insert failed for match {match_id}")

