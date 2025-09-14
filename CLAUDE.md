# Usogui Fansite

A comprehensive fansite for the Usogui manga series featuring character information, story arcs, community guides, and media galleries.

## Project Structure

This is a monorepo containing:
- **client/**: Next.js frontend application
- **server/**: NestJS backend API
- **docs/**: Documentation files

## Quick Start

### Prerequisites
- Node.js 18+
- Yarn (we use yarn, not npm)
- PostgreSQL database

### Development Setup

1. **Install dependencies for both client and server:**
   ```bash
   cd client && yarn install
   cd ../server && yarn install
   ```

2. **Start the backend server:**
   ```bash
   cd server
   yarn start:dev
   ```

3. **Start the frontend client:**
   ```bash
   cd client
   yarn dev
   ```

## Key Commands

### Root Level
- Use `yarn` commands in individual client/server directories

### Server Commands
- `yarn start:dev` - Start development server with hot reload
- `yarn build` - Build for production
- `yarn start:prod` - Start production server
- `yarn lint` - Run ESLint
- `yarn test` - Run unit tests
- `yarn db:migrate` - Run database migrations
- `yarn db:seed` - Seed database with initial data

### Client Commands
- `yarn dev` - Start development server with Turbopack
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn lint` - Run Next.js linting

## Architecture

- **Frontend**: Next.js 15 with App Router, React 19, Tailwind CSS 4, React Admin
- **Backend**: NestJS with TypeORM, PostgreSQL, JWT authentication, Swagger docs
- **Authentication**: JWT tokens with Discord OAuth integration
- **File Storage**: Backblaze B2 for media uploads
- **Admin Panel**: React Admin for content management

## Database

The project uses PostgreSQL with TypeORM. Key entities include:
- Users (with role-based permissions)
- Characters, Arcs, Volumes, Chapters
- Gambles, Events, Factions
- Media, Guides, Quotes
- Tags and Translations

## API Endpoints

Backend runs on http://localhost:3001/api with:
- `/auth` - Authentication endpoints
- `/characters` - Character management
- `/arcs` - Story arc information
- `/guides` - Community guides
- `/media` - Media gallery
- `/gambles` - Gamble information
- And many more...

## User Roles

- **Public**: View content, submit guides/media
- **Moderator**: Edit content, approve submissions
- **Admin**: Full system access including user management

## Development Notes

- Always use yarn instead of npm
- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Implement proper error handling and validation
- Test changes thoroughly before commits