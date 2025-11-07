import axios, { AxiosResponse } from 'axios';
import {
  User,
  UserLogin,
  AuthResponse,
  Match,
  ChampionMastery,
  ChampionRecommendation,
  ChampionStats,
  DifficultMatchup,
  MatchupStats,
  MatchupDetails,
} from '../types';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject({
      message: error.response?.data?.detail || error.message || 'An error occurred',
      status: error.response?.status || 500,
      details: error.response?.data,
    });
  }
);

const apiService = {
  // Authentication endpoints
  // Registration removed; login auto-creates users

  async login(credentials: UserLogin): Promise<AuthResponse> {
    console.log('🔍 API: Logging in...');
    const response: AxiosResponse<AuthResponse> = await api.post('/auth/login', credentials);
    console.log('🔍 API: Login response:', response.data);
    return response.data;
  },

  // User endpoints
  async getUserProfile(): Promise<User> {
    console.log('🔍 API: Getting user profile...');
    const response: AxiosResponse<User> = await api.get('/users/profile');
    console.log('🔍 API: User profile response:', response.data);
    return response.data;
  },

  async getMatchHistory(): Promise<Match[]> {
    console.log('🔍 API: Getting match history...');
    const response: AxiosResponse<Match[]> = await api.get('/users/match-history');
    console.log('🔍 API: Match history response:', response.data);
    return response.data;
  },

  async getChampionMastery(): Promise<ChampionMastery[]> {
    console.log('🔍 API: Getting champion mastery...');
    const response: AxiosResponse<ChampionMastery[]> = await api.get('/users/champion-mastery');
    console.log('🔍 API: Champion mastery response:', response.data);
    return response.data;
  },

  async getDifficultMatchups(role?: string, game_mode?: string): Promise<DifficultMatchup[]> {
    console.log('🔍 API: Getting difficult matchups...');
    const response: AxiosResponse<any> = await api.get('/matchups/difficult', { params: { role, game_mode } });
    console.log('🔍 API: Difficult matchups response:', response.data);
    // Extract the actual matchups array from the response
    return response.data.difficult_matchups || response.data || [];
  },

  async getDifficultMatchupsFull(role?: string, game_mode?: string): Promise<any> {
    console.log('🔍 API: Getting difficult matchups (full response)...');
    const response: AxiosResponse<any> = await api.get('/matchups/difficult', { params: { role, game_mode } });
    console.log('🔍 API: Difficult matchups full response:', response.data);
    return response.data;
  },

  async getChampionRecommendations(role?: string, game_mode?: string): Promise<ChampionRecommendation[]> {
    console.log('🔍 API: Getting champion recommendations...');
    const response: AxiosResponse<any> = await api.get('/champions/recommendations', { params: { role, game_mode } });
    console.log('🔍 API: Champion recommendations response:', response.data);
    // Extract the actual recommendations array from the response
    return response.data.recommendations || response.data || [];
  },

  async getChampionCounters(champion: string): Promise<ChampionStats[]> {
    console.log('🔍 API: Getting champion counters...');
    const response: AxiosResponse<ChampionStats[]> = await api.get(`/champions/counters/${champion}`);
    console.log('🔍 API: Champion counters response:', response.data);
    return response.data;
  },

  async getChampionStats(champion: string): Promise<ChampionStats> {
    const response: AxiosResponse<ChampionStats> = await api.get(`/champions/stats/${champion}`);
    return response.data;
  },

  async getChampionMatchupData(champion1: string, champion2: string): Promise<MatchupStats> {
    console.log('🔍 API: Getting champion matchup data...');
    const response: AxiosResponse<MatchupStats> = await api.get(`/matchups/vs/${champion1}/${champion2}`);
    console.log('🔍 API: Champion matchup data response:', response.data);
    return response.data;
  },

  async getMatchupDetails(opponent: string, role?: string, game_mode?: string): Promise<MatchupDetails> {
    console.log('🔍 API: Getting matchup details...');
    const params: Record<string, string> = {};
    if (role) params.role = role;
    if (game_mode) params.game_mode = game_mode;
    const response: AxiosResponse<MatchupDetails> = await api.get(`/matchups/details/${encodeURIComponent(opponent)}`, { params });
    return response.data;
  },

  async refreshUserData(): Promise<{ message: string }> {
    console.log('🔍 API: Refreshing user data...');
    const response: AxiosResponse<{ message: string }> = await api.post('/users/refresh-data');
    console.log('🔍 API: Refresh response:', response.data);
    return response.data;
  },

  async healthCheck(): Promise<{ status: string; database: string }> {
    console.log('🔍 API: Health check...');
    const response: AxiosResponse<{ status: string; database: string }> = await api.get('/health');
    console.log('🔍 API: Health check response:', response.data);
    return response.data;
  },
};

export default apiService;