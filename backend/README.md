# League Analytics Backend

A comprehensive League of Legends analytics platform backend built with FastAPI and PostgreSQL.

## Features

- **User Authentication**: JWT-based authentication with Riot account integration
- **Match Analysis**: Process and analyze match history data
- **Matchup Analysis**: Identify difficult matchups for players
- **Champion Recommendations**: Suggest champions based on matchup data
- **Caching**: Redis-based caching for improved performance
- **Rate Limiting**: Respects Riot API rate limits

## Tech Stack

- **Framework**: FastAPI
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Cache**: Redis
- **Authentication**: JWT with bcrypt password hashing
- **API**: Riot Games API integration

## Setup

1. **Install Dependencies**
   `ash
   pip install -r requirements.txt
   `

2. **Database Setup**
   - Install PostgreSQL
   - Create database: league_analytics
   - Update .env with your database credentials

3. **Redis Setup**
   - Install Redis
   - Update .env with Redis connection details

4. **Environment Configuration**
   `ash
   cp .env.example .env
   # Edit .env with your configuration
   `

5. **Run the Application**
   `ash
   python run.py
   `

## API Endpoints

### Authentication
- POST /auth/register - Register new user
- POST /auth/login - Login user

### Users
- GET /users/profile - Get user profile
- GET /users/match-history - Get match history
- GET /users/champion-mastery - Get champion mastery
- POST /users/refresh-data - Refresh user data

### Matchups
- GET /matchups/difficult - Get difficult matchups
- GET /matchups/champion/{champion_name} - Get champion matchup data
- GET /matchups/vs/{champion1}/{champion2} - Get head-to-head matchup

### Champions
- GET /champions/recommendations - Get champion recommendations
- GET /champions/counters/{champion_name} - Get champion counters
- GET /champions/stats/{champion_name} - Get champion stats

## Database Schema

### Users Table
- id: Primary key
- iot_id: Riot username
- 	ag: Riot tag
- puuid: Riot PUUID
- hashed_password: Bcrypt hashed password
- created_at: Account creation timestamp
- last_updated: Last update timestamp

### Matches Table
- id: Primary key
- match_id: Riot match ID
- user_id: Foreign key to users
- champion: Champion played
- opponent_champion: Opponent champion
- 	eam_position: Role/position
- win: Win/loss result
- Performance stats (KDA, CS, damage, etc.)

### Champion Mastery Table
- id: Primary key
- user_id: Foreign key to users
- champion_id: Riot champion ID
- champion_name: Champion name
- champion_level: Mastery level
- champion_points: Mastery points

### Matchup Stats Table
- id: Primary key
- user_id: Foreign key to users
- champion: Player's champion
- opponent_champion: Opponent champion
- 	eam_position: Role/position
- Win rate and performance statistics

## Development

The application uses a modular structure:
- pp/models/: SQLAlchemy database models
- pp/api/: FastAPI route handlers
- pp/services/: Business logic services
- pp/utils/: Utility functions
- config/: Configuration settings

## API Documentation

Once running, visit http://localhost:8000/docs for interactive API documentation.
