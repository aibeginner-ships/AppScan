# AppScan - App Review Summarizer

## Overview

AppScan is a web application that analyzes user reviews from Google Play Store and Apple App Store using AI-powered sentiment analysis. Users paste an app store URL and instantly receive insights including sentiment trends, categorized feedback, rating analysis, and top negative reviews.

## Current Status

**Fully Functional MVP** - The application successfully:
- Scrapes up to 500 reviews from Google Play and Apple App Store
- Uses OpenAI (gpt-5-mini) for sentiment analysis and topic extraction
- Displays comprehensive analysis with charts and categorized feedback
- Provides a clean, responsive UI with loading states and error handling

## User Preferences

- **Application Name**: AppScan
- **Tagline**: "Get instant clarity on what users love and hate about your app"
- **Design Philosophy**: Clean, minimal UI with information density and clarity
- **Communication Style**: Simple, everyday language

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool

**Routing**: Wouter for lightweight client-side routing
- Home page (`/`) - URL input and submission
- Analysis display (same page, state-based) - Results visualization

**State Management**: 
- React Query (@tanstack/react-query) for server state
- useState for local UI state (form input, analysis results)

**UI Component Library**: Shadcn UI (Radix UI primitives) with Tailwind CSS
- Design system follows clean, minimal approach
- Typography using Inter (body) and JetBrains Mono (data/technical)
- Custom color scheme with light/dark mode support

**Data Visualization**: Recharts for rendering rating trend line charts

**Key Components**:
- `Home.tsx` - Main page with URL input form and state management
- `Analysis.tsx` - Results page with summary cards, charts, and review list
- `LoadingSpinner.tsx` - Loading state during analysis
- `ErrorState.tsx` - Error handling with retry functionality
- `SummaryCards.tsx` - Three-card layout for positive/negative categories and rating
- `ReviewList.tsx` - Table of top negative reviews
- `TrendChart.tsx` - Line chart showing rating trends over time

### Backend Architecture

**Runtime**: Node.js with Express.js server

**API Endpoints**:
- `POST /api/analyze` - Main endpoint that accepts app store URL and returns analysis

**Data Flow**:
1. Client submits app store URL via POST request
2. Server detects platform (Google Play vs Apple App Store)
3. Server extracts app ID from URL
4. Server scrapes reviews using platform-specific scrapers:
   - **Google Play**: Fetches up to 500 reviews in single request
   - **Apple App Store**: Paginates through up to 10 pages to collect 500 reviews
5. Server sends reviews to OpenAI for sentiment analysis and categorization
6. Server calculates statistics and rating trends by month
7. Results returned to client as JSON

**Key Backend Files**:
- `server/routes.ts` - API endpoint implementation with URL validation, platform detection, and review scraping
- `server/analyzer.ts` - OpenAI sentiment analysis and review categorization logic
- `server/openai.ts` - OpenAI client configuration using Replit AI Integrations
- `server/types/` - TypeScript type definitions for scraper libraries

**In-Memory Storage**: No database persistence - analysis results exist only in session memory

**Type Safety**: Shared schema definitions using Zod for runtime validation and TypeScript type inference

### External Dependencies

**AI Integration**: OpenAI via Replit AI Integrations
- Model: gpt-5-mini for cost-effective sentiment analysis
- Uses Replit AI Integrations service (no API key required)
- Analyzes up to 60 reviews (30 positive, 30 negative) to extract categories
- Generates 3-5 category labels for positive and negative feedback
- Fallback categories if OpenAI fails: ["User Experience", "Features", "Design"] / ["Performance", "Bugs", "Price"]

**App Store Scraping**:
- `google-play-scraper` - Fetches reviews and app metadata from Google Play Store
  - Single request for up to 500 reviews sorted by newest
  - Returns review text, score, date, username
- `app-store-scraper` - Fetches reviews and app metadata from Apple App Store
  - Paginates through up to 10 pages (~50 reviews per page)
  - Returns review text, score, updated date, username

### Design System

**Color Scheme**:
- Primary: Blue (#2176DB) for interactive elements
- Positive: Green shades for positive feedback
- Negative: Red shades for negative feedback
- Card backgrounds with subtle contrast
- Full dark mode support

**Typography**:
- Inter: Body text and UI elements
- JetBrains Mono: Numerical data and ratings

**Spacing**: Consistent spacing scale (2, 4, 6, 8, 12, 16, 20, 24px)

**Components**:
- Cards with rounded corners and subtle borders
- Badges for categories with color-coded sentiment
- Loading states with spinners
- Error states with retry actions

## Technical Implementation Details

### URL Validation and Extraction

**Google Play URLs**:
- Pattern: `https://play.google.com/store/apps/details?id=APP_ID`
- Extraction regex: `/id=([^&]+)/`
- Example: `com.spotify.music`

**Apple App Store URLs**:
- Pattern: `https://apps.apple.com/*/app/*/idNUMBERS`
- Extraction regex: `/id(\d+)/`
- Example: `324684580`

### Review Normalization

Both platforms return different review structures. Normalization ensures consistent data:

```typescript
{
  text: string,      // Review comment text
  score: number,     // Rating (1-5)
  date: Date         // Review date (from 'date' or 'updated' field)
}
```

### Sentiment Analysis Process

1. **Review Filtering**:
   - Positive: score >= 4, has text (min 10 chars), limit 50 reviews
   - Negative: score <= 2, has text (min 10 chars), limit 50 reviews

2. **OpenAI Analysis**:
   - Sends up to 30 reviews per sentiment to OpenAI
   - Prompts for 3-5 category labels per sentiment
   - Response format: JSON with `positive` and `negative` arrays

3. **Category Extraction**:
   - Short category names (1-3 words)
   - Most commonly mentioned topics
   - Examples: "UI Design", "Performance", "Ads", "Price"

### Trend Calculation

1. Group reviews by month (YYYY-MM format)
2. Calculate average rating per month
3. Sort chronologically
4. Return last 6 months
5. Display as line chart with Recharts

### Error Handling

**Frontend**:
- URL validation before submission
- Loading states during API calls
- Error messages for failed requests
- Retry functionality

**Backend**:
- Zod schema validation for requests
- Platform detection validation
- Review scraping error handling (per-page failures logged)
- OpenAI API failure fallbacks
- Empty review set handling

## Environment Variables

- `AI_INTEGRATIONS_OPENAI_BASE_URL` - Replit AI Integrations endpoint (auto-configured)
- `AI_INTEGRATIONS_OPENAI_API_KEY` - Replit AI Integrations key (auto-configured)
- `SESSION_SECRET` - Express session secret (auto-configured)

## Development Workflow

**Running the Application**:
```bash
npm run dev
```
This starts:
- Express backend server on port 5000
- Vite frontend dev server (proxied through Express)

**File Structure**:
```
├── client/               # Frontend React application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components (Home, Analysis)
│   │   └── lib/          # Utilities and query client
├── server/               # Backend Express application
│   ├── routes.ts         # API endpoint definitions
│   ├── analyzer.ts       # OpenAI sentiment analysis
│   ├── openai.ts         # OpenAI client setup
│   └── types/            # TypeScript type definitions
├── shared/               # Shared types and schemas
│   └── schema.ts         # Zod schemas for validation
└── design_guidelines.md  # UI/UX design specifications
```

## Known Limitations

1. **Review Count**: Limited to 500 reviews per analysis (platform API limits)
2. **Language**: Reviews are fetched in default language (English for US)
3. **Persistence**: No database - results are session-only
4. **Rate Limiting**: Scraper libraries may be throttled by app stores with heavy usage
5. **Trend Data**: Only available if reviews have timestamps
6. **OpenAI Cost**: Each analysis consumes Replit AI Integration credits

## Testing

**End-to-End Test Results**:
- ✅ Home page loads with correct UI elements
- ✅ URL validation works for both platforms
- ✅ Loading spinner displays during analysis
- ✅ Analysis page shows all required components
- ✅ Data flows correctly from backend to frontend
- ✅ Navigation between pages works correctly
- ✅ Test performed with Spotify (Google Play) - 500 reviews analyzed successfully

## Future Enhancements

Potential features for future iterations:
- Database persistence for historical tracking
- Comparison mode (analyze multiple apps side-by-side)
- Export functionality (PDF/CSV downloads)
- Word cloud visualizations
- Filter by star rating or date range
- Multi-language support
- Sentiment trend tracking over extended periods
- Email alerts for significant rating changes

## Recent Changes (October 26, 2025)

- ✅ Implemented complete MVP with Google Play and Apple App Store support
- ✅ Added OpenAI sentiment analysis using gpt-5-mini
- ✅ Created responsive UI with Recharts visualization
- ✅ Fixed App Store pagination to fetch up to 500 reviews
- ✅ Fixed date normalization for App Store reviews (trend data)
- ✅ Successfully tested end-to-end with real app data
- ✅ Fixed CSS import order warning
