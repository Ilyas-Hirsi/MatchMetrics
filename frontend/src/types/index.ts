// User types
export interface User {
  id: number;
  riot_id: string;
  tag: string;
  puuid: string;
  created_at: string;
  last_updated?: string;
}

export interface UserCreate {
  riot_id: string;
  tag: string;
}

export interface UserLogin {
  riot_id: string;
  tag: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

// Match types
export interface Match {
  match_id: string;
  champion: string;
  opponent_champion?: string;
  team_position: string;
  win: boolean;
  game_duration: number;
  kda: {
    kills: number;
    deaths: number;
    assists: number;
  };
  cs_per_min: number;
  gold_per_min: number;
  kill_participation: number;
  damage_to_champs_per_min: number;
  game_creation?: string;
  queue_id?: number;
  game_mode?: string;
}

export interface MatchStats {
  match_id: string;
  champion: string;
  kda: {
    kills: number;
    deaths: number;
    assists: number;
  };
  cs_per_min: number;
  gold_per_min: number;
  kill_participation: number;
  damage_to_champs_per_min: number;
  win: boolean;
  game_duration: number;
  team_position: string;
  timestamp?: number;
}

// Champion types
export interface ChampionMastery {
  champion_id: number;
  champion_name: string;
  champion_level: number;
  champion_points: number;
  last_played?: string;
}

export interface ChampionRecommendation {
  champion: string;
  mastery_points: number;
  mastery_level: number;
  counter_win_rate: number;
  games_vs_opponents: number;
  counters: string[];
  reason: string;
}

export interface ChampionStats {
  champion: string;
  win_rate: number;
  pick_rate: number;
  ban_rate: number;
  tier: string;
  role: string;
  counters?: Array<{
    champion: string;
    win_rate: number;
    games?: number;
  }>;
  strong_against?: Array<string | { champion: string; win_rate?: number }>;
  weak_against?: Array<string | { champion: string; win_rate?: number }>;
}

// Matchup types
export interface MatchupStats {
  champion: string;
  opponent_champion: string;
  games_played: number;
  wins: number;
  losses: number;
  win_rate: number;
  avg_kda: {
    kills: number;
    deaths: number;
    assists: number;
  };
  avg_cs_per_min: number;
  avg_damage_per_min: number;
  difficulty_score: number;
}

export interface DifficultMatchup {
  champion: string;
  games_played: number;
  wins: number;
  losses: number;
  win_rate: number;
  avg_kda: {
    kills: number;
    deaths: number;
    assists: number;
  };
  avg_cs_per_min: number;
  avg_damage_per_min: number;
}

export interface MatchupDetails {
  opponent: string;
  games: number;
  wins: number;
  losses: number;
  win_rate: number;
  avg_kda: { kills: number; deaths: number; assists: number };
  avg_cs_per_min: number;
  avg_gold_per_min: number;
  avg_damage_per_min: number;
  avg_game_duration_min: number;
  role_distribution: Record<string, number>;
  game_mode_distribution: Record<string, number>;
  recent_matches: Array<{
    match_id: string;
    date: string | null;
    champion: string;
    opponent_champion?: string | null;
    win: boolean;
    kda: { kills: number; deaths: number; assists: number };
    cs_per_min: number;
    gold_per_min: number;
    damage_to_champs_per_min: number;
    game_duration_min: number;
    role?: string | null;
    game_mode?: string | null;
  }>;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Chart data types
export interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

export interface WinRateData {
  champion: string;
  winRate: number;
  gamesPlayed: number;
}

export interface KDAChartData {
  champion: string;
  kills: number;
  deaths: number;
  assists: number;
}

// Form types
export interface LoginFormData {
  riot_id: string;
  tag: string;
}

export interface RegisterFormData {
  riot_id: string;
  tag: string;
}

// Context types
export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: UserLogin) => Promise<void>;
  register: (userData: UserCreate) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Error types
export interface ApiError {
  message: string;
  status: number;
  details?: any;
}


