# Company Analytics Platform

## Overview

This is a full-stack web application built for company analytics and report generation. The system provides a dashboard for viewing company data stored in Neo4j, generates PDF reports through n8n workflows, and includes authentication through Replit's OAuth system.

The frontend is built with JavaScript (JSX) without TypeScript, as requested by the user. All components use modern React patterns with Tailwind CSS for styling.

## User Preferences

Preferred communication style: Simple, everyday language.
Frontend requirement: JavaScript/JSX only, no TypeScript code.
Authentication system: Local PostgreSQL authentication (username/password) instead of Replit Auth.
User roles: Admin and user roles with automatic admin user creation.

## System Architecture

The application follows a modern full-stack architecture with clear separation between frontend, backend, and external services:

### Frontend Architecture
- **Framework**: React with JavaScript (JSX files, no TypeScript)
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for PostgreSQL operations
- **Authentication**: Replit OAuth with session management
- **API Design**: RESTful endpoints with structured error handling

## Key Components

### Authentication System
- Uses local PostgreSQL authentication with username/password
- Session storage in PostgreSQL using connect-pg-simple
- User registration and login with role-based access control
- Automatic admin user creation (username: admin, password: admin123)
- JWT session management with passport-local strategy

### Database Layer
- **Primary Database**: PostgreSQL with Drizzle ORM
- **Graph Database**: Neo4j for company relationship data
- **Connection**: Neon serverless PostgreSQL for scalability
- **Schema**: Defined in shared/schema.ts with Zod validation

### External Service Integrations
- **Neo4j**: Graph database for company data and sector analytics
- **n8n**: Workflow automation for PDF report generation
- **File Storage**: Local file system for generated reports

### UI Components
- Complete shadcn/ui component library implementation
- Responsive design with mobile-first approach
- Consistent design system with CSS custom properties
- Toast notifications for user feedback

## Data Flow

1. **Authentication Flow**: User logs in via Replit OAuth → Session created in PostgreSQL → User data stored/updated
2. **Dashboard Data**: Frontend queries dashboard stats → Backend aggregates data from Neo4j and PostgreSQL → Returns combined metrics
3. **Report Generation**: User selects company → Frontend triggers report creation → Backend calls n8n workflow → File generated and status tracked in PostgreSQL

## External Dependencies

### Required Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (Neon serverless)
- `SESSION_SECRET`: Session encryption key (automatically provided by Replit)
- `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`: Neo4j connection details (loaded from .env file)
- `N8N_BASE_URL`, `N8N_API_KEY`, `N8N_WORKFLOW_ID`: n8n workflow service credentials
- `REPLIT_DOMAINS`, `ISSUER_URL`, `REPL_ID`: Replit OAuth configuration

### Neo4j Query Implementation
The application now uses the exact Cypher query provided by the user:
```cypher
MATCH (n:SUK) RETURN n.nome_azienda, n.settore, n.descrizione
```
- Neo4j authentication reads credentials from environment variables in .env file
- Company data queries use the SUK node type as specified
- Fallback data is provided when Neo4j is unavailable
- Integration with existing Docker containers via localhost ports

### Service Integration Status
- **Neo4j**: Configured to connect to existing Docker container on port 7687
- **n8n**: Configured to connect to existing Docker container on port 5678
- **Scripts**: Provided start-services.sh and check-services.js for container management
- **Documentation**: README-services.md contains integration guide and troubleshooting

### External Services
- **Neon Database**: Serverless PostgreSQL hosting
- **Neo4j**: Graph database for company analytics
- **n8n**: Workflow automation platform
- **Replit Auth**: OAuth provider

## Deployment Strategy

### Development
- Vite dev server with HMR for frontend development
- tsx for TypeScript execution in development
- Replit-specific development tooling and error overlays

### Production Build
- Frontend: Vite builds optimized React bundle to `dist/public`
- Backend: esbuild bundles TypeScript server to `dist/index.js`
- Static file serving through Express in production

### Database Management
- Drizzle Kit for schema migrations (`db:push` command)
- PostgreSQL schema in `shared/schema.ts`
- Automatic table creation for sessions (required for Replit Auth)

### Key Architectural Decisions

1. **Monorepo Structure**: Client, server, and shared code in single repository for easier development and deployment
2. **Frontend Language**: JavaScript/JSX for frontend components (no TypeScript), TypeScript for backend and shared schemas
3. **Docker Containerization**: Complete Docker Compose setup for PostgreSQL, Neo4j, n8n, and the application
4. **Serverless Database**: Neon PostgreSQL chosen for automatic scaling and WebSocket support
5. **Graph Database Integration**: Neo4j selected for complex company relationship queries and sector analytics
6. **Component Library**: shadcn/ui provides consistent, accessible UI components
7. **Workflow Automation**: n8n integration enables flexible report generation pipelines
8. **Fallback Data**: Neo4j service provides sample data when external database is unavailable