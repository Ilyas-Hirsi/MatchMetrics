// Format KDA ratio
export const formatKDA = (kills: number, deaths: number, assists: number): string => {
  const kda = deaths === 0 ? kills + assists : (kills + assists) / deaths;
  return kda.toFixed(2);
};

// Format win rate percentage
export const formatWinRate = (wins: number, games: number): string => {
  if (games === 0) return '0%';
  return `${((wins / games) * 100).toFixed(1)}%`;
};

// Format large numbers (e.g., mastery points)
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

// Format game duration
export const formatGameDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Format duration given minutes (possibly fractional) into HH:MM:SS
export const formatHMSFromMinutes = (minutes: number): string => {
  const totalSeconds = Math.max(0, Math.round(minutes * 60));
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const hh = hours.toString();
  const mm = mins.toString().padStart(2, '0');
  const ss = secs.toString().padStart(2, '0');
  return hours > 0 ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`;
};

// Get difficulty color based on win rate
export const getDifficultyColor = (winRate: number): string => {
  if (winRate >= 60) return '#4caf50'; // Green - Easy
  if (winRate >= 45) return '#ff9800'; // Orange - Medium
  return '#f44336'; // Red - Hard
};

// Get tier color
export const getTierColor = (tier: string): string => {
  const tierColors: { [key: string]: string } = {
    S: '#ff6b6b',
    A: '#4ecdc4',
    B: '#45b7d1',
    C: '#96ceb4',
    D: '#feca57',
    F: '#ff9ff3',
  };
  return tierColors[tier] || '#6c757d';
};

// Calculate champion mastery level color
export const getMasteryLevelColor = (level: number): string => {
  if (level >= 7) return '#ffd700'; // Gold
  if (level >= 5) return '#c0c0c0'; // Silver
  if (level >= 3) return '#cd7f32'; // Bronze
  return '#6c757d'; // Gray
};

// Validate Riot ID format
export const isValidRiotId = (riotId: string): boolean => {
  // Riot ID should be 3-16 characters, alphanumeric and underscores
  const regex = /^[a-zA-Z0-9_]{3,16}$/;
  return regex.test(riotId);
};

// Validate Riot Tag format
export const isValidRiotTag = (tag: string): boolean => {
  // Tag should be 3-5 characters, alphanumeric
  const regex = /^[a-zA-Z0-9]{3,5}$/;
  return regex.test(tag);
};

// Generate chart colors
export const generateChartColors = (count: number): string[] => {
  const colors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00',
    '#0088fe', '#00c49f', '#ffbb28', '#ff8042', '#8884d8',
    '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#0088fe'
  ];
  
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(colors[i % colors.length]);
  }
  return result;
};

// Debounce function
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Local storage helpers
export const storage = {
  get: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },
  
  remove: (key: string): void => {
    localStorage.removeItem(key);
  },
  
  clear: (): void => {
    localStorage.clear();
  }
};


