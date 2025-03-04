# Jamaican Cultural Storytelling Platform

A comprehensive platform for preserving Jamaican cultural narratives through bilingual digital storytelling with advanced media capture technologies.

## Project Overview

This platform enables users to:
- Record and preserve cultural stories in both English and Patois
- Capture audio recordings with automatic transcription
- Maintain a structured questionnaire flow
- Review and edit previously submitted responses
- Navigate through a series of cultural questions

## Architecture

### Frontend (React + TypeScript)
- Located in `/client/src`
- Uses shadcn/ui components for consistent UI
- React Query for data fetching and caching
- Wouter for lightweight routing
- Framer Motion for animations

Key Components:
- `/pages`: Main route components (dashboard, questionnaire, etc.)
- `/components/questionnaire`: Core questionnaire functionality
- `/components/ui`: Reusable UI components
- `/lib`: Utility functions and configurations

### Backend (Node.js + Express)
- Located in `/server`
- RESTful API endpoints
- JWT-based authentication
- PostgreSQL database integration via Drizzle ORM

## Database Schema

The database structure is defined in `shared/schema.ts` using Drizzle ORM:

```typescript
- users: User accounts and authentication
  - id: Primary key
  - username: Unique identifier
  - passwordHash: Encrypted password
  - name: Display name
  - role: User role (admin/user)

- questions: Predefined cultural questions
  - id: Primary key
  - text: Question content
  - order: Display order

- responses: User responses to questions
  - id: Primary key
  - userId: Foreign key to users
  - questionId: Foreign key to questions
  - textResponse: Written answer
  - audioUrl: Path to audio recording
  - transcriptions: Array of transcribed text
```

## Authentication

- JWT-based authentication system
- Token stored in localStorage
- Protected routes require valid token
- Two user roles: admin and regular user
- Token refresh mechanism for extended sessions

## State Management

### Dashboard (`/client/src/pages/dashboard.tsx`)
- Displays all user responses
- Handles audio playback
- Provides editing capabilities
- Manages response filtering and display

### Questionnaire Form (`/client/src/components/questionnaire/QuestionnaireForm.tsx`)
- Maintains independent state for each question
- Handles form data persistence
- Manages audio recording and transcription
- Controls navigation between questions

## Form Handling

The questionnaire form uses:
- React Hook Form for form state
- Zod for schema validation
- Independent state management per question
- Automatic save on navigation

## API Endpoints

All API routes are defined in `server/routes.ts`:

```typescript
POST /api/auth/login       // User authentication
POST /api/auth/register   // New user registration
GET /api/questions        // Fetch all questions
GET /api/user/responses   // Get user's responses
POST /api/responses       // Create/update response
```

## Development Guidelines

### Adding New Features

1. Schema Updates:
   - Add new models in `shared/schema.ts`
   - Use Drizzle's schema definition
   - Update insert/select types

2. Backend Changes:
   - Modify `server/storage.ts` for new storage operations
   - Add routes in `server/routes.ts`
   - Update authentication in `server/auth.ts` if needed

3. Frontend Updates:
   - Add new components in appropriate directories
   - Update queries in relevant components
   - Maintain consistent styling with shadcn/ui

### State Management Best Practices

1. Form State:
   - Use `useForm` hook with Zod validation
   - Maintain independent state per form
   - Clear form state appropriately

2. API Integration:
   - Use React Query for data fetching
   - Handle loading and error states
   - Implement proper cache invalidation

3. Audio Handling:
   - Manage recording state independently
   - Handle transcription updates properly
   - Clear audio state on form reset

### Common Pitfalls

1. Form Clearing:
   - Only clear forms on explicit navigation
   - Maintain separate state per question
   - Properly handle form reset

2. Authentication:
   - Always include token in API requests
   - Handle token expiration
   - Redirect to login when unauthorized

3. State Persistence:
   - Save data before navigation
   - Handle unsaved changes
   - Maintain independent question states

## Testing

1. User Flows:
   - Test authentication flow
   - Verify question navigation
   - Check response persistence

2. Audio Features:
   - Test recording functionality
   - Verify transcription process
   - Check audio playback

3. Form Handling:
   - Validate form submissions
   - Test error handling
   - Verify state management

## Deployment

The application is deployed on Replit:
- Automatic deployment on changes
- Environment variables managed through Replit
- Database provisioned through Replit

## Contributing

1. Code Style:
   - Follow TypeScript best practices
   - Maintain consistent component structure
   - Use provided UI components

2. Testing:
   - Test changes thoroughly
   - Verify mobile responsiveness
   - Check audio functionality

3. Documentation:
   - Update README for significant changes
   - Document new API endpoints
   - Maintain code comments
