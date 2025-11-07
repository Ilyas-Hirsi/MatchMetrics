import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Paper,
  Divider,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Person as PersonIcon,
  Timeline as TimelineIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import { useUserProfile, useMatchHistory, useChampionMastery, useRefreshUserData } from '../hooks/useApi';
import { formatNumber, formatWinRate, formatKDA, getMasteryLevelColor, formatHMSFromMinutes } from '../utils/helpers';

const ProfilePage: React.FC = () => {
  const { data: user, isLoading: userLoading, error: userError } = useUserProfile();
  const { data: matches, isLoading: matchesLoading } = useMatchHistory();
  const { data: mastery, isLoading: masteryLoading } = useChampionMastery();
  const refreshUserData = useRefreshUserData();

  const isLoading = userLoading || matchesLoading || masteryLoading;

  const handleRefresh = async () => {
    try {
      await refreshUserData.mutateAsync();
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  };

  // Calculate overall stats
  const totalMatches = matches?.length || 0;
  const totalWins = matches?.filter(match => match.win).length || 0;
  const overallWinRate = totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0;

  // Calculate average KDA
  const totalKills = matches?.reduce((sum, match) => sum + match.kda.kills, 0) || 0;
  const totalDeaths = matches?.reduce((sum, match) => sum + match.kda.deaths, 0) || 0;
  const totalAssists = matches?.reduce((sum, match) => sum + match.kda.assists, 0) || 0;
  const avgKDA = totalDeaths > 0 ? (totalKills + totalAssists) / totalDeaths : totalKills + totalAssists;

  // Top champions by mastery
  const topChampions = mastery?.slice(0, 5) || [];

  if (userError) {
    return (
      <Alert severity="error">
        Failed to load profile data. Please try again.
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Profile
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Your League of Legends profile and statistics
      </Typography>

      <Grid container spacing={3}>
        {/* User Info Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: 'primary.main',
                    fontSize: '2rem',
                    mb: 2,
                  }}
                >
                  {user?.riot_id?.charAt(0).toUpperCase()}
                </Avatar>
                
                <Typography variant="h5" gutterBottom>
                  {user?.riot_id}
                </Typography>
                
                <Typography variant="h6" color="primary" gutterBottom>
                  #{user?.tag}
                </Typography>

                <Divider sx={{ width: '100%', my: 2 }} />

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Member since
                </Typography>
                <Typography variant="body1">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                </Typography>

                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={handleRefresh}
                  disabled={refreshUserData.isPending}
                  sx={{ mt: 2 }}
                >
                  {refreshUserData.isPending ? 'Refreshing...' : 'Refresh Data'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Overall Stats */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Overall Statistics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'background.default' }}>
                    <Typography variant="h4" color="primary">
                      {totalMatches}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Matches Analyzed
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'background.default' }}>
                    <Typography variant="h4" color="success.main">
                      {totalWins}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Wins
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'background.default' }}>
                    <Typography variant="h4" color="error.main">
                      {totalMatches - totalWins}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Losses
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'background.default' }}>
                    <Typography variant="h4" color="warning.main">
                      {overallWinRate.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Win Rate
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>
                Performance Metrics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'background.default' }}>
                    <Typography variant="h5" color="info.main">
                      {avgKDA.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Average KDA
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'background.default' }}>
                    <Typography variant="h5" color="secondary.main">
                      {mastery?.length || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Champions Mastered
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'background.default' }}>
                    <Typography variant="h5" color="primary.main">
                      {formatNumber(mastery?.reduce((sum, champ) => sum + champ.champion_points, 0) || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Mastery Points
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Champions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Champions by Mastery
              </Typography>
              <Grid container spacing={2}>
                {topChampions.map((champion, index) => (
                  <Grid item xs={12} sm={6} md={4} lg={2.4} key={champion.champion_id}>
                    <Paper sx={{ p: 2, bgcolor: 'background.default', textAlign: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                        <TrophyIcon sx={{ mr: 1, color: getMasteryLevelColor(champion.champion_level) }} />
                        <Typography variant="h6">
                          #{index + 1}
                        </Typography>
                      </Box>
                      
                      <Typography variant="subtitle1" gutterBottom>
                        {champion.champion_name}
                      </Typography>
                      
                      <Chip
                        label={`Level ${champion.champion_level}`}
                        size="small"
                        sx={{ mb: 1 }}
                      />
                      
                      <Typography variant="body2" color="text.secondary">
                        {formatNumber(champion.champion_points)} points
                      </Typography>
                      
                      {champion.last_played && (
                        <Typography variant="caption" color="text.secondary">
                          Last played: {new Date(champion.last_played).toLocaleDateString()}
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Matches */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Matches
              </Typography>
              <Grid container spacing={1}>
                {matches?.slice(0, 10).map((match, index) => (
                  <Grid item xs={12} sm={6} md={4} lg={2.4} key={match.match_id}>
                    <Paper sx={{ p: 1.5, bgcolor: 'background.default' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2">
                          {match.champion}
                        </Typography>
                        <Chip
                          label={match.win ? 'Win' : 'Loss'}
                          size="small"
                          color={match.win ? 'success' : 'error'}
                        />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary">
                        KDA: {formatKDA(match.kda.kills, match.kda.deaths, match.kda.assists)}
                      </Typography>
                      
                      <Typography variant="caption" color="text.secondary">
                        {formatHMSFromMinutes(match.game_duration)}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfilePage;


