import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Grid,
  FormControl, InputLabel, Select, MenuItem,
  CircularProgress, Alert, Chip, Table,
  TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Button, Dialog,
  DialogTitle, DialogContent, Divider,
} from '@mui/material';
import { useDifficultMatchupsFull, useChampionMatchupData, useMatchupDetails } from '../hooks/useApi';
import { formatWinRate, formatKDA, getDifficultyColor } from '../utils/helpers';

const MatchupsPage: React.FC = () => {
  // State management
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedChampion, setSelectedChampion] = useState<string>('');
  const [detailsOpen, setDetailsOpen] = useState<boolean>(false);
  const [selectedGameMode, setSelectedGameMode] = useState<string>('');

  // API hooks
  const { data: difficultMatchupsResponse, isLoading: matchupsLoading, error: matchupsError } = 
    useDifficultMatchupsFull(selectedRole, selectedGameMode);
  useChampionMatchupData(selectedChampion, '');

  const { data: matchupDetails, isLoading: detailsLoading } = 
    useMatchupDetails(selectedChampion, selectedRole || undefined, selectedGameMode || undefined);

  // Extract matchups data
  const difficultMatchups = difficultMatchupsResponse?.difficult_matchups || [];

  // Filter options
  const roles = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];
  const gameModes = [
    'Ranked Solo/Duo', 'Ranked Flex', 'ARAM', 'Clash',
    'URF', 'One for All', 'Nexus Blitz', 'Ultimate Spellbook', 'Arena',
  ];

  // Event handlers
  const handleRoleChange = (event: any) => setSelectedRole(event.target.value);
  const handleGameModeChange = (event: any) => setSelectedGameMode(event.target.value);
  const handleChampionSelect = (champion: string) => {
    setSelectedChampion(champion);
    setDetailsOpen(true);
  };
  const closeDetails = () => setDetailsOpen(false);

  // Loading and error states
  if (matchupsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (matchupsError) {
    return (
      <Alert severity="error">
        Failed to load matchup data. Please try again.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Matchup Analysis
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Analyze your most difficult matchups and find ways to improve
      </Typography>

      {/* Filter Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl sx={{ minWidth: 220 }}>
              <InputLabel>Filter by Role</InputLabel>
              <Select
                value={selectedRole}
                label="Filter by Role"
                onChange={handleRoleChange}
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

            <FormControl sx={{ minWidth: 260 }}>
              <InputLabel>Filter by Game Mode</InputLabel>
              <Select
                value={selectedGameMode}
                label="Filter by Game Mode"
                onChange={handleGameModeChange}
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
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Difficult Matchups Chart removed per requirements */}

        {/* Summary Statistics */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Summary
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Analyzed
                  </Typography>
                  <Typography variant="h4">
                    {difficultMatchupsResponse?.total_analyzed || 0}
                  </Typography>
                </Paper>
                <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="body2" color="text.secondary">
                    Difficult Matchups
                  </Typography>
                  <Typography variant="h4">
                    {difficultMatchupsResponse?.difficult_matchups?.length || 0}
                  </Typography>
                </Paper>
                <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="body2" color="text.secondary">
                    Role Filter
                  </Typography>
                  <Typography variant="h6">
                    {selectedRole || 'All Roles'}
                  </Typography>
                </Paper>
                <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="body2" color="text.secondary">
                    Game Mode Filter
                  </Typography>
                  <Typography variant="h6">
                    {selectedGameMode || 'All Modes'}
                  </Typography>
                </Paper>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Matchup Data Table */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Detailed Matchup Statistics
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Champion</TableCell>
                      <TableCell align="right">Games</TableCell>
                      <TableCell align="right">Wins</TableCell>
                      <TableCell align="right">Losses</TableCell>
                      <TableCell align="right">Win Rate</TableCell>
                      <TableCell align="right">Avg KDA</TableCell>
                      <TableCell align="right">CS/Min</TableCell>
                      <TableCell align="right">Damage/Min</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {difficultMatchups?.map((matchup: any) => (
                      <TableRow key={matchup.champion}>
                        <TableCell component="th" scope="row">
                          <Typography variant="subtitle1" fontWeight="bold">
                            {matchup.champion}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{matchup.games_played}</TableCell>
                        <TableCell align="right">{matchup.wins}</TableCell>
                        <TableCell align="right">{matchup.losses}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={formatWinRate(matchup.wins, matchup.games_played)}
                            size="small"
                            sx={{
                              bgcolor: getDifficultyColor(matchup.win_rate),
                              color: 'white',
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          {formatKDA(matchup.avg_kda.kills, matchup.avg_kda.deaths, matchup.avg_kda.assists)}
                        </TableCell>
                        <TableCell align="right">{matchup.avg_cs_per_min.toFixed(1)}</TableCell>
                        <TableCell align="right">{matchup.avg_damage_per_min.toFixed(0)}</TableCell>
                        <TableCell align="center">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleChampionSelect(matchup.champion)}
                          >
                            Analyze
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Detailed Analysis Modal */}
        <Dialog open={detailsOpen} onClose={closeDetails} fullWidth maxWidth="md">
          <DialogTitle>
            Matchup Details vs {selectedChampion}
          </DialogTitle>
          <DialogContent dividers>
            {detailsLoading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : matchupDetails ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                      <Typography variant="body2" color="text.secondary">Games</Typography>
                      <Typography variant="h5">{matchupDetails.games}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                      <Typography variant="body2" color="text.secondary">Win Rate</Typography>
                      <Typography variant="h5">{matchupDetails.win_rate}%</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                      <Typography variant="body2" color="text.secondary">Avg KDA</Typography>
                      <Typography variant="h6">{formatKDA(matchupDetails.avg_kda.kills, matchupDetails.avg_kda.deaths, matchupDetails.avg_kda.assists)}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                      <Typography variant="body2" color="text.secondary">CS / Min</Typography>
                      <Typography variant="h5">{matchupDetails.avg_cs_per_min}</Typography>
                    </Paper>
                  </Grid>
                </Grid>

                <Divider />
                <Typography variant="subtitle1">Role & Mode Distribution</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>By Role</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {Object.entries(matchupDetails.role_distribution).map(([role, count]) => (
                        <Chip key={role} label={`${role}: ${count}`} size="small" />
                      ))}
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>By Game Mode</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {Object.entries(matchupDetails.game_mode_distribution).map(([mode, count]) => (
                        <Chip key={mode} label={`${mode}: ${count}`} size="small" />
                      ))}
                    </Box>
                  </Grid>
                </Grid>

                <Divider />
                <Typography variant="subtitle1">Recent Match History</Typography>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Champion</TableCell>
                        <TableCell>Win</TableCell>
                        <TableCell align="right">K / D / A</TableCell>
                        <TableCell align="right">CS/Min</TableCell>
                        <TableCell align="right">Dmg/Min</TableCell>
                        <TableCell align="right">Duration</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Mode</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {matchupDetails.recent_matches.map((m) => (
                        <TableRow key={m.match_id}>
                          <TableCell>{m.date ? new Date(m.date).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>{m.champion}</TableCell>
                          <TableCell>
                            <Chip label={m.win ? 'Win' : 'Loss'} color={m.win ? 'success' : 'error'} size="small" />
                          </TableCell>
                          <TableCell align="right">{`${m.kda.kills} / ${m.kda.deaths} / ${m.kda.assists}`}</TableCell>
                          <TableCell align="right">{m.cs_per_min}</TableCell>
                          <TableCell align="right">{m.damage_to_champs_per_min}</TableCell>
                          <TableCell align="right">{m.game_duration_min}m</TableCell>
                          <TableCell>{m.role || '-'}</TableCell>
                          <TableCell>{m.game_mode || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ) : (
              <Typography color="text.secondary">No details available.</Typography>
            )}
          </DialogContent>
        </Dialog>
      </Grid>
    </Box>
  );
};

export default MatchupsPage;


