# App Review Summarizer

## Overview

App Review Summarizer is a web application that analyzes user reviews from Google Play Store and Apple App Store. Users paste an app store URL and receive AI-powered insights including sentiment analysis, categorized feedback, rating trends, and top negative reviews. The application is designed as a single-session MVP with no user authentication or data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool

**Routing**: Wouter for lightweight client-side routing with two main routes:
- Home page (`/`) - URL input and submission
- Analysis display (same page, state-based) - Results visualization

**State Management**: React Query (@tanstack/react-query) for server state management and caching

**UI Component Library**: Shadcn UI (Radix UI primitives) with Tailwind CSS
- Design system follows "New York" style variant
- Custom design guidelines emphasizing clarity and information density
- Typography using Inter (body) and JetBrains Mono (data/technical)
- Utility-first approach inspired by Linear and Vercel's minimalist design

**Data Visualization**: Recharts for rendering rating trend charts

**Form Handling**: React Hook Form with Zod validation

### Backend Architecture

**Runtime**: Node.js with Express.js server

**API Pattern**: RESTful API with single primary endpoint:
- `POST /api/analyze` - Accepts app store URL, returns analysis results

**Data Flow**:
1. Client submits app store URL
2. Server detects platform (Google Play vs Apple App Store)
3. Server scrapes reviews using platform-specific scrapers
4. Server sends reviews to OpenAI for sentiment analysis and categorization
5. Server calculates statistics and trends
6. Results returned to client as JSON

**In-Memory Storage**: MemStorage class pattern (no database persistence)
- Session-based storage for potential user data
- Analysis results not persisted - computed on-demand

**Type Safety**: Shared schema definitions using Zod for runtime validation and TypeScript type inference

### External Dependencies

**AI Integration**: OpenAI API via Replit's AI Integrations service
- Uses GPT-5 model for review categorization
- Analyzes sentiment and extracts topic categories
- Base URL and API key provided via environment variables

**App Store Scraping**:
- `google-play-scraper` - Fetches reviews and app metadata from Google Play Store
- `app-store-scraper` - Fetches reviews and app metadata from Apple App Store
- Both scrapers retrieve up to 500 most recent reviews

**Database Configuration**: Drizzle ORM configured with PostgreSQL
- Schema defined in `shared/schema.ts`
- Configuration points to `DATABASE_URL` environment variable
- Currently minimal usage - prepared for future persistence features

**Development Tools**:
- Replit-specific plugins for runtime error handling and debugging
- ESBuild for production bundling
- TypeScript for type checking across full stack

### Design System

**Tailwind Configuration**:
- Custom border radius values (9px, 6px, 3px)
- HSL-based color system with CSS variables
- Support for light/dark modes
- Hover and active state elevation utilities

**Component Patterns**:
- Card-based layouts for data presentation
- Badge components for category display
- Responsive grid layouts (mobile-first approach)
- Custom spacing scale: 2, 4, 6, 8, 12, 16, 20, 24px units