-- Add indexes to optimize match queries
CREATE INDEX IF NOT EXISTS idx_matches_user_id ON matches(user_id);
CREATE INDEX IF NOT EXISTS idx_matches_user_id_created_at ON matches(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_matches_user_id_game_creation ON matches(user_id, game_creation);
CREATE INDEX IF NOT EXISTS idx_matches_game_mode ON matches(game_mode);
CREATE INDEX IF NOT EXISTS idx_matches_opponent_champion ON matches(opponent_champion);
CREATE INDEX IF NOT EXISTS idx_matches_user_position ON matches(user_id, team_position);
CREATE INDEX IF NOT EXISTS idx_matches_user_game_mode ON matches(user_id, game_mode);

-- Add indexes to optimize champion mastery queries
CREATE INDEX IF NOT EXISTS idx_champion_mastery_user_id ON champion_mastery(user_id);
CREATE INDEX IF NOT EXISTS idx_champion_mastery_user_id_points ON champion_mastery(user_id, champion_points);

