import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '../services/api';

// Query keys
export const queryKeys = {
  userProfile: ['userProfile'] as const,
  matchHistory: ['matchHistory'] as const,
  championMastery: ['championMastery'] as const,
  difficultMatchups: (role?: string) => ['difficultMatchups', role] as const,
  championRecommendations: (role?: string) => ['championRecommendations', role] as const,
  championCounters: (champion: string) => ['championCounters', champion] as const,
  championStats: (champion: string) => ['championStats', champion] as const,
  healthCheck: ['healthCheck'] as const,
};

// User data hooks
export const useUserProfile = () => {
  return useQuery({
    queryKey: queryKeys.userProfile,
    queryFn: apiService.getUserProfile,
    enabled: !!localStorage.getItem('token'),
  });
};

export const useMatchHistory = () => {
  return useQuery({
    queryKey: queryKeys.matchHistory,
    queryFn: apiService.getMatchHistory,
    enabled: !!localStorage.getItem('token'),
    staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache for 30 minutes
  });
};

export const useChampionMastery = () => {
  return useQuery({
    queryKey: queryKeys.championMastery,
    queryFn: apiService.getChampionMastery,
    enabled: !!localStorage.getItem('token'),
    staleTime: 10 * 60 * 1000, // 10 minutes - mastery changes less frequently
    gcTime: 60 * 60 * 1000, // 60 minutes - keep in cache for 1 hour
  });
};

// Matchup analysis hooks
export const useDifficultMatchups = (role?: string, gameMode?: string) => {
  return useQuery({
    queryKey: ['difficultMatchups', role, gameMode],
    queryFn: () => apiService.getDifficultMatchups(role, gameMode),
    enabled: !!localStorage.getItem('token'),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 1,
  });
};

export const useDifficultMatchupsFull = (role?: string, gameMode?: string) => {
  return useQuery({
    queryKey: ['difficultMatchupsFull', role, gameMode],
    queryFn: () => apiService.getDifficultMatchupsFull(role, gameMode),
    enabled: !!localStorage.getItem('token'),
    retry: 1,
  });
};

export const useChampionRecommendations = (role?: string, gameMode?: string) => {
  return useQuery({
    queryKey: ['championRecommendations', role, gameMode],
    queryFn: () => apiService.getChampionRecommendations(role, gameMode),
    enabled: !!localStorage.getItem('token'),
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
};

export const useChampionCounters = (champion: string) => {
  return useQuery({
    queryKey: queryKeys.championCounters(champion),
    queryFn: () => apiService.getChampionCounters(champion),
    enabled: !!champion && !!localStorage.getItem('token'),
  });
};

export const useChampionStats = (champion: string) => {
  return useQuery({
    queryKey: queryKeys.championStats(champion),
    queryFn: () => apiService.getChampionStats(champion),
    enabled: !!champion && !!localStorage.getItem('token'),
  });
};


export const useChampionMatchupData = (champion1: string, champion2: string) => {
  return useQuery({
    queryKey: ['championMatchupData', champion1, champion2],
    queryFn: () => apiService.getChampionMatchupData(champion1, champion2),
    enabled: !!champion1 && !!champion2 && !!localStorage.getItem('token'),
  });
};
export const useMatchupDetails = (opponent: string, role?: string, gameMode?: string) => {
  return useQuery({
    queryKey: ['matchupDetails', opponent, role, gameMode],
    queryFn: () => apiService.getMatchupDetails(opponent, role, gameMode),
    enabled: !!opponent && !!localStorage.getItem('token'),
    retry: 1,
  });
};

// Mutation hooks
export const useRefreshUserData = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: apiService.refreshUserData,
    onSuccess: () => {
      // Invalidate all user-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.userProfile });
      queryClient.invalidateQueries({ queryKey: queryKeys.matchHistory });
      queryClient.invalidateQueries({ queryKey: queryKeys.championMastery });
      queryClient.invalidateQueries({ queryKey: ['difficultMatchups'] });
      queryClient.invalidateQueries({ queryKey: ['championRecommendations'] });
    },
  });
};

// Health check hook
export const useHealthCheck = () => {
  return useQuery({
    queryKey: queryKeys.healthCheck,
    queryFn: apiService.healthCheck,
    refetchInterval: 30000, // Check every 30 seconds
  });
};

