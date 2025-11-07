import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Grid,
  FormControl, InputLabel, Select, MenuItem,
  CircularProgress, Chip,
  TextField, InputAdornment, Button, Avatar,
  LinearProgress, Divider, Stack,
} from '@mui/material';
import {
  Search as SearchIcon,
  Star as StarIcon,
  MilitaryTech as MilitaryTechIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { useChampionRecommendations, useChampionStats } from '../hooks/useApi';
import { formatNumber, getMasteryLevelColor, generateChartColors } from '../utils/helpers';

const ChampionsPage: React.FC = () => {
  // State management for filters and selections
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedGameMode, setSelectedGameMode] = useState<string>('');
  const [searchChampion, setSearchChampion] = useState<string>('');
  const [selectedChampion, setSelectedChampion] = useState<string>('');

  // API hooks for data fetching
  const { data: recommendationsResponse } = 
    useChampionRecommendations(selectedRole, selectedGameMode);
  const { data: championStats, isLoading: statsLoading } = 
    useChampionStats(selectedChampion);

  const recommendations = recommendationsResponse;
  

  // Filter options
  const roles = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];
  const gameModes = [
    'Ranked Solo/Duo', 'Ranked Flex', 'ARAM', 'Clash',
    'URF', 'One for All', 'Nexus Blitz', 'Ultimate Spellbook', 'Arena',
  ];

  // Event handlers
  const handleRoleChange = (event: any) => setSelectedRole(event.target.value);
  const handleGameModeChange = (event: any) => setSelectedGameMode(event.target.value);
  const handleChampionSearch = () => {
    if (searchChampion.trim()) {
      // Format champion name: first letter uppercase, rest lowercase (e.g., "Yasuo", "Master Yi")
      const formattedChampion = searchChampion.trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      console.log(`Searching for champion: ${formattedChampion}`);
      setSelectedChampion(formattedChampion);
    }
  };

  // Data transformations for charts
  const recommendationData = recommendations?.map((rec: any) => ({
    champion: rec.champion,
    winRate: rec.counter_win_rate,
    masteryPoints: rec.mastery_points,
    masteryLevel: rec.mastery_level,
    counters: rec.counters.length,
  }));

  const masteryData = recommendations?.slice(0, 6).map((rec: any) => ({
    name: rec.champion,
    value: rec.mastery_points,
    level: rec.mastery_level,
  }));

  const colors = generateChartColors(6);

  return (
    <Box sx={{ 
      background: 'black',
      minHeight: '100vh',
      py: 3
    }}>
      <Box sx={{ maxWidth: '1400px', mx: 'auto', px: 3 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" sx={{ 
            fontWeight: 'bold', 
            color: '#1976d2', 
            mb: 2
          }}>
            Champion Analysis
          </Typography>
          <Typography variant="h6" sx={{ 
            color: 'white', 
            fontWeight: 300,
            maxWidth: '600px',
            mx: 'auto'
          }}>
            Discover champion recommendations and counter strategies based on your match history
          </Typography>
        </Box>

        {/* Filters */}
        <Card sx={{ 
          mb: 4, 
          borderRadius: 3,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          background: '#424242'
        }}>
          <CardContent sx={{ p: 4 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Filter by Role</InputLabel>
                  <Select
                    value={selectedRole}
                    label="Filter by Role"
                    onChange={handleRoleChange}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="">
                      <em>All Roles</em>
                    </MenuItem>
                    {roles.map((role) => (
                      <MenuItem key={role} value={role}>
                        {role}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Filter by Game Mode</InputLabel>
                  <Select
                    value={selectedGameMode}
                    label="Filter by Game Mode"
                    onChange={handleGameModeChange}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="">
                      <em>All Modes</em>
                    </MenuItem>
                    {gameModes.map((mode) => (
                      <MenuItem key={mode} value={mode}>
                        {mode}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Search Champion"
                  placeholder="Enter champion name (e.g., Yasuo, Lux, Darius)"
                  value={searchChampion}
                  onChange={(e) => setSearchChampion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchChampion.trim()) {
                      handleChampionSearch();
                    }
                  }}
                  sx={{ borderRadius: 2 }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button
                          variant="contained"
                          onClick={handleChampionSearch}
                          disabled={!searchChampion.trim()}
                          sx={{ 
                            borderRadius: 2,
                            backgroundColor: '#1976d2',
                            '&:hover': {
                              backgroundColor: '#1565c0',
                            }
                          }}
                        >
                          <SearchIcon />
                        </Button>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Grid container spacing={4}>
          {/* Only show recommendations if no champion is selected */}
          {!selectedChampion && (
            <>
              {/* Champion Recommendations */}
              <Grid item xs={12} lg={8}>
                <Card sx={{ 
                  borderRadius: 3,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  backdropFilter: '#424242',
                  background: '#424242'
                }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3}}>
                      <MilitaryTechIcon sx={{ mr: 2, color: '#1976d2', fontSize: 28 }} />
                      <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                        Recommended Champions
                        {selectedRole && ` (${selectedRole})`}
                      </Typography>
                    </Box>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={recommendationData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis 
                          dataKey="champion" 
                          tick={{ fontSize: 12 }}
                          axisLine={{ stroke: '#1976d2' }}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          axisLine={{ stroke: '#1976d2' }}
                        />
                        <Tooltip
                          contentStyle={{
                            background: 'rgba(255,255,255,0.95)',
                            border: 'none',
                            borderRadius: 12,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                          }}
                          formatter={(value: any, name: string) => [
                            name === 'winRate' ? `${value}%` : formatNumber(value),
                            name === 'winRate' ? 'Counter Win Rate' : 
                            name === 'masteryPoints' ? 'Mastery Points' : 'Counters'
                          ]}
                        />
                        <Bar 
                          dataKey="winRate" 
                          fill="url(#winRateGradient)"
                          radius={[4, 4, 0, 0]}
                        />
                        <defs>
                          <linearGradient id="winRateGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#1976d2" />
                            <stop offset="100%" stopColor="#764ba2" />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Mastery Distribution */}
              <Grid item xs={12} lg={4}>
                <Card sx={{ 
                  borderRadius: 3,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  backdropFilter: 'blur(10px)',
                  background: '#424242'
                }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <StarIcon sx={{ mr: 2, color: '#1976d2', fontSize: 28 }} />
                      <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                        Mastery Distribution
                      </Typography>
                    </Box>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={masteryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name} (${formatNumber(value)})`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {masteryData?.map((_, idx) => (
                            <Cell key={`cell-${idx}`} fill={colors[idx % colors.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{
                            background: '#424242',
                            border: 'none',
                            borderRadius: 12,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Recommendation Cards */}
              <Grid item xs={12}>
                <Card sx={{ 
                  borderRadius: 3,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  backdropFilter: 'blur(10px)',
                  background: '#424242'
                }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                      <AnalyticsIcon sx={{ mr: 2, color: '#1976d2', fontSize: 28 }} />
                      <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                        Detailed Recommendations
                      </Typography>
                    </Box>
                    <Grid container spacing={3}>
                      {recommendations?.map((rec: any) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={rec.champion}>
                          <Card sx={{ 
                            height: '100%',
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                            border: '1px solid rgba(102, 126, 234, 0.2)',
                            transition: 'all 0.3s ease',
                            overflow: 'hidden',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: '0 12px 40px rgba(102, 126, 234, 0.2)',
                            }
                          }}>
                            {/* Champion Image Header */}
                            <Box sx={{ 
                              position: 'relative', 
                              height: 150,
                              background: `linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%)`,
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center'
                            }}>
                              <img 
                                src={`https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${rec.champion.replace(/\s/g, '')}.png`}
                                alt={rec.champion}
                                style={{ 
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  opacity: 0.6
                                }}
                                onError={(e: any) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                              <Box sx={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
                                p: 2
                              }}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                                  {rec.champion}
                                </Typography>
                              </Box>
                            </Box>
                            
                            <CardContent sx={{ p: 2 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
                              
                                <Chip
                                  label={`Level ${rec.mastery_level}`}
                                  size="small"
                                  sx={{ 
                                    background: getMasteryLevelColor(rec.mastery_level),
                                    color: 'white',
                                    fontWeight: 'bold'
                                  }}
                                />
                                <Chip
                                  label={`${formatNumber(rec.mastery_points)} pts`}
                                  size="small"
                                  sx={{ 
                                    background: 'rgba(255,255,255,0.1)',
                                    color: 'white',
                                    border: '1px solid rgba(255,255,255,0.3)'
                                  }}
                                />
                              </Box>

                              <Box sx={{ mb: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    Counter Win Rate
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                                    {rec.counter_win_rate.toFixed(1)}%
                                  </Typography>
                                </Box>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={rec.counter_win_rate} 
                                  sx={{ 
                                    borderRadius: 2,
                                    height: 8,
                                    '& .MuiLinearProgress-bar': {
                                      background: 'linear-gradient(45deg, #1976d2 30%, #764ba2 90%)',
                                    }
                                  }} 
                                />
                              </Box>
                              
                              <Box sx={{ mb: 1 }}>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Counters {rec.counters.length} difficult matchup{rec.counters.length !== 1 ? 's' : ''}
                                </Typography>
                              </Box>

                              <Divider sx={{ my: 1.5 }} />

                              <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>
                                  Counters:
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {rec.counters.slice(0, 4).map((counter: string) => (
                                    <Chip
                                      key={counter}
                                      label={counter}
                                      size="small"
                                      sx={{ 
                                        background: 'rgba(102, 126, 234, 0.2)',
                                        color: 'white',
                                        border: '1px solid rgba(102, 126, 234, 0.4)',
                                        fontSize: '0.7rem'
                                      }}
                                    />
                                  ))}
                                  {rec.counters.length > 4 && (
                                    <Chip
                                      label={`+${rec.counters.length - 4}`}
                                      size="small"
                                      sx={{ 
                                        background: 'rgba(118, 75, 162, 0.2)',
                                        color: 'white',
                                        border: '1px solid rgba(118, 75, 162, 0.4)',
                                        fontSize: '0.7rem'
                                      }}
                                    />
                                  )}
                                </Box>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}

          {/* Champion-Specific Analysis */}
          {selectedChampion && (
            <Grid item xs={12}>
              <Card sx={{ 
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                backdropFilter: 'blur(10px)',
                background: '#424242'
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ 
                        bgcolor: '#1976d2',
                        mr: 2,
                        width: 48,
                        height: 48
                      }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {selectedChampion.charAt(0)}
                        </Typography>
                      </Avatar>
                      <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                        u.gg Analysis: {selectedChampion}
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setSelectedChampion('');
                        setSearchChampion('');
                      }}
                      sx={{ 
                        color: 'white',
                        borderColor: 'rgba(255,255,255,0.3)',
                        '&:hover': {
                          borderColor: 'white',
                          backgroundColor: 'rgba(255,255,255,0.1)'
                        }
                      }}
                    >
                      Clear Search
                    </Button>
                  </Box>
                  
                  {statsLoading ? (
                    <Box display="flex" justifyContent="center" p={4}>
                      <CircularProgress size={60} sx={{ color: '#1976d2' }} />
                    </Box>
                  ) : (
                    <Grid container spacing={4}>
                      {/* Champion Stats */}
                      {championStats && (
                        <Grid item xs={12} md={6}>
                          <Card sx={{ 
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                            border: '1px solid rgba(102, 126, 234, 0.2)'
                          }}>
                            <CardContent sx={{ p: 3 }}>
                              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                                General Stats from u.gg
                              </Typography>
                              <Stack spacing={2}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="body2">Win Rate:</Typography>
                                  <Chip
                                    label={`${typeof championStats.win_rate === 'number' ? championStats.win_rate.toFixed(2) : championStats.win_rate}%`}
                                    size="small"
                                    sx={{ 
                                      background: championStats.win_rate > 50 ? 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)' : 'linear-gradient(45deg, #f44336 30%, #ef5350 90%)',
                                      color: 'white',
                                      fontWeight: 'bold'
                                    }}
                                  />
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="body2">Pick Rate:</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    {typeof championStats.pick_rate === 'number' ? championStats.pick_rate.toFixed(2) : championStats.pick_rate}%
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="body2">Ban Rate:</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    {typeof championStats.ban_rate === 'number' ? championStats.ban_rate.toFixed(2) : championStats.ban_rate}%
                                  </Typography>
                                </Box>
                              </Stack>
                            </CardContent>
                          </Card>
                        </Grid>
                      )}

                      {/* u.gg Champion Data */}
                      {championStats && (
                        <Grid item xs={12} md={6}>
                          <Card sx={{ 
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                            border: '1px solid rgba(102, 126, 234, 0.2)'
                          }}>
                            <CardContent sx={{ p: 3 }}>
                              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                                u.gg Data
                              </Typography>
                              
                              {/* Difficult Matchups - Champions this champion struggles against */}
                              {championStats.weak_against && championStats.weak_against.length > 0 && (
                                <Box sx={{ mb: 3 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                    Difficult Matchups:
                                  </Typography>
                                  <Stack spacing={1}>
                                    {championStats.weak_against.slice(0, 5).map((counter: any) => (
                                      <Box key={counter.champion} sx={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        p: 1.5,
                                        borderRadius: 2,
                                        background: 'rgba(255,255,255,0.3)',
                                        border: '1px solid rgba(102, 126, 234, 0.1)'
                                      }}>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                          {counter.champion}
                                        </Typography>
                                        <Chip
                                          label={`${typeof counter.win_rate === 'number' ? counter.win_rate.toFixed(2) : counter.win_rate}%`}
                                          size="small"
                                          sx={{ 
                                            background: counter.win_rate > 50 ? 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)' : 'linear-gradient(45deg, #f44336 30%, #ef5350 90%)',
                                            color: 'white',
                                            fontWeight: 'bold'
                                          }}
                                        />
                                      </Box>
                                    ))}
                                  </Stack>
                                </Box>
                              )}

                              {/* Counters - Champions this champion beats */}
                              {championStats.counters && championStats.counters.length > 0 && (
                                <Box sx={{ mb: 3 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                    Champions Beat (Favorable Matchups):
                                  </Typography>
                                  <Stack spacing={1}>
                                    {championStats.counters.slice(0, 5).map((counter: any) => (
                                      <Box key={counter.champion} sx={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        p: 1.5,
                                        borderRadius: 2,
                                        background: 'rgba(255,255,255,0.3)',
                                        border: '1px solid rgba(102, 126, 234, 0.1)'
                                      }}>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                          {counter.champion}
                                        </Typography>
                                        <Chip
                                          label={`${typeof counter.win_rate === 'number' ? counter.win_rate.toFixed(2) : counter.win_rate}%`}
                                          size="small"
                                          sx={{ 
                                            background: counter.win_rate > 50 ? 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)' : 'linear-gradient(45deg, #f44336 30%, #ef5350 90%)',
                                            color: 'white',
                                            fontWeight: 'bold'
                                          }}
                                        />
                                      </Box>
                                    ))}
                                  </Stack>
                                </Box>
                              )}

                            </CardContent>
                          </Card>
                        </Grid>
                      )}
                    </Grid>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Box>
    </Box>
  );
};

export default ChampionsPage;


