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
import { RegisterFormData } from '../types';

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

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError('');

    try {
      await registerUser({
        riot_id: data.riot_id,
        tag: data.tag,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
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
          Enter your Riot ID and Tag to continue. An account will be created automatically on first sign-in.
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

              {/* No password fields; registration by Riot ID + Tag */}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={24} /> : 'Sign Up'}
              </Button>

              <Box textAlign="center">
                <Link component={RouterLink} to="/login" variant="body2">
                  Already have an account? Sign In
                </Link>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            By signing up, you agree to our{' '}
            <Link href="#" variant="body2">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="#" variant="body2">
              Privacy Policy
            </Link>
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default RegisterPage;



