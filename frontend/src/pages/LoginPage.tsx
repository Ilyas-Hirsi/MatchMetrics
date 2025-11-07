import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  TextField,
  Typography,
  Link,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
import { LoginFormData } from '../types';

const schema = yup.object({
  riot_id: yup
    .string()
    .required('Riot ID is required')
    .min(3, 'Riot ID must be at least 3 characters')
    .max(16, 'Riot ID must be at most 16 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Riot ID can only contain letters, numbers, and underscores'),
  tag: yup
    .string()
    .required('Tag is required')
    .min(3, 'Tag must be at least 3 characters')
    .max(5, 'Tag must be at most 5 characters')
    .matches(/^[a-zA-Z0-9]+$/, 'Tag can only contain letters and numbers'),
});

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError('');

    try {
      await login(data);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h4" gutterBottom>
          League Analytics
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Sign in to analyze your League of Legends performance
        </Typography>

        <Card sx={{ width: '100%', maxWidth: 400 }}>
          <CardContent>
            <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1 }}>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <TextField
                margin="normal"
                required
                fullWidth
                id="riot_id"
                label="Riot ID"
                autoComplete="username"
                autoFocus
                {...register('riot_id')}
                error={!!errors.riot_id}
                helperText={errors.riot_id?.message}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                id="tag"
                label="Tag"
                autoComplete="username"
                {...register('tag')}
                error={!!errors.tag}
                helperText={errors.tag?.message}
              />

              {/* No password field; login by Riot ID + Tag */}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={24} /> : 'Sign In'}
              </Button>

              <Box textAlign="center">
                <Link component={RouterLink} to="/register" variant="body2">
                  Don't have an account? Sign Up
                </Link>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Need help? Check out our{' '}
            <Link href="#" variant="body2">
              documentation
            </Link>
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default LoginPage;



