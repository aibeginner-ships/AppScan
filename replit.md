# AppScan v3.3 - App Review Summarizer with Cal.com-Inspired SaaS Design

## Overview

AppScan is a web application designed to analyze user reviews from Google Play Store and Apple App Store. It provides instant, AI-powered insights, including sentiment percentages, monthly trends, categorized feedback, rating analysis, and a list of top negative reviews. **Version 3.3** introduces a refined Cal.com/Loops.so-inspired design with subtle borders, softer shadows, generous whitespace, and a cohesive neutral color palette. The project aims to give users clear understanding of what customers appreciate and dislike about their applications.

## User Preferences

- **Application Name**: AppScan
- **Tagline**: "Get instant clarity on what users love and hate about your app"
- **Design Philosophy**: Clean, minimal UI with information density and clarity
- **Communication Style**: Simple, everyday language

## System Architecture

### Frontend

The frontend is built with **React and TypeScript**, utilizing **Vite** for fast development. **Wouter** handles lightweight client-side routing, and **React Query** manages server state, while `useState` handles local UI state. The UI is designed with **Shadcn UI (Radix UI primitives)** and **Tailwind CSS**, featuring a clean, minimal aesthetic with custom color schemes and light/dark mode support. **Recharts** is used for data visualization, including rating trend line charts and sentiment stacked bar charts.

### Backend

The backend uses **Node.js with Express.js**. It exposes a `POST /api/analyze` endpoint that accepts app store URLs. The server detects the platform, extracts the app ID, and scrapes up to 500 reviews using platform-specific scrapers. It then classifies sentiment based on review scores (4+ positive, 2- negative, 3 neutral), aggregates monthly trends for ratings and sentiment, and generates actionable insights using **semantic clustering** (v3.1). Results are returned as JSON, with no database persistence. **Zod** is used for schema validation, ensuring type safety.

### Sentiment Analysis System

Sentiment is classified based on review scores: 4+ is Positive, 2- is Negative, and 3 is Neutral. Monthly trends track average ratings and positive/negative review counts over the last 6 months. An insight generator compares sentiment changes between the first and last month of data, providing natural language summaries of improvements, declines, or stability.

### Insight Generation System (v3.1.3)

**Version 3.1.3** introduces a semantic clustering pipeline with clarity-focused refinements:

1. **Semantic Clustering** (`semanticClusterer.ts`):
   - Primary: LLM-based clustering using OpenAI chat completions to identify 3-5 semantic themes
   - Fallback: Keyword-based clustering using 7 predefined categories (crashes, performance, login, pricing, features, UI, support)
   - Cluster refinement pass to split mixed-topic clusters using 8 keyword themes (v3.1.1)
   - Ensures distributed cluster assignment across reviews

2. **Insight Refinement** (`insightRefiner.ts`):
   - Per-cluster insight generation with OpenAI
   - Text similarity-based quote selection using Jaccard index (v3.1.1)
   - Enhanced prompts with top keywords for better context (v3.1.1)
   - Specific action generation with 10 concrete templates (v3.1.1)
   - Keyword extraction fallback for titles when OpenAI fails
   - **NEW in v3.1.3**: Rule-based Impact/Confidence scoring for transparency
     - **Impact**: High if negative_ratio > 70% OR share > 5%; Medium if share > 2%; else Low
     - **Confidence**: High if mentions > 30; Medium if mentions > 10; else Low
   - **NEW in v3.1.3**: Quote similarity score included in JSON output for frontend filtering
   - Uniqueness enforcement: Post-processing ensures no duplicate titles/actions
   - Per-cluster metrics calculation: mentions, share (%), negative_ratio

3. **UI/UX Refinements** (v3.1.3):
   - **Conditional Quote Display**: Quotes only shown if similarity > 0.5 AND length > 20 characters
   - **Simplified Card Layout**: "Suggested Action" section removed from display (kept in backend for compatibility)
   - **Badge Color Mapping**: High = Green, Medium = Yellow, Low = Grey for clarity and consistency

4. **ML Utilities** (`utils/ml.ts`):
   - Cosine similarity calculation
   - K-means clustering (available for future embeddings-based clustering)

**Key Improvements (v3.1.3)**:
- **Transparent scoring**: Rule-based Impact/Confidence logic users can understand and trust
- **Reduced noise**: Only relevant quotes displayed; generic actions hidden
- **Professional appearance**: Consistent badge colors and cleaner card layout
- **Quote alignment**: Representative quotes semantically match insight themes (v3.1.1)
- **Action specificity**: Concrete, actionable suggestions in backend (v3.1.1)
- **Cluster purity**: Keyword-based refinement prevents mixed-topic clusters (v3.1.1)
- Semantically distinct insights (no duplicates)
- Accurate per-cluster metrics (not global averages)
- Robust multi-level fallback system

### UI/UX Design

**v3.3 introduces a refined Cal.com/Loops.so-inspired SaaS aesthetic:**

- **Visual Design**: Ultra-clean minimal interface with subtle borders and generous whitespace
- **Typography**: Refined hierarchy with text-base headings, text-sm body text for better scanning
- **Color Palette**: 
  - Background: #F9FAFB (soft gray)
  - Cards: White (#FFFFFF) with border-gray-100
  - Text: #111827 (primary headings), #6B7280 (secondary body text)
- **Spacing**: Generous padding (p-8 on cards), space-y-10 between sections, max-w-6xl container
- **Layout**: 2-column grid for insight cards on desktop, responsive single column on mobile
- **Interactions**: Subtle shadow transitions (shadow-sm → shadow-md on hover), no lift effects
- **Animations**: Fade-in effects for insight cards, smooth auto-scroll to insights after analysis (800ms delay)
- **Icons**: Professional Lucide icons (Gauge, BarChart3, TrendingUp, Star, etc.) in color-coded containers
- **Components**: All cards use rounded-2xl, border-gray-100, shadow-sm with hover:shadow-md
- **App Sentiment Snapshot**: Compact 4-metric grid (Avg Rating, Positive %, Negative %, Reviews)

**v3.3 Key Refinements**:
- ✨ Softer, more professional shadows (shadow-sm default instead of shadow-md)
- ✨ Consistent subtle borders (border-gray-100) on all cards
- ✨ Increased padding and spacing for breathable layout
- ✨ Refined typography sizes for cleaner information hierarchy
- ✨ Auto-scroll to insights section after analysis completion
- ✨ Compact dashboard-style App Sentiment Snapshot

The design prioritizes clarity and breathing room with a Cal.com-inspired minimal approach. Full dark mode support with neutral-900 backgrounds and adjusted contrast. Color-coded badges (green/yellow/grey for Impact, blue/amber/grey for Confidence) provide quick visual cues.

## External Dependencies

-   **AI Integration**: **OpenAI** via Replit AI Integrations (using `gpt-5-mini`) for cost-effective topic extraction from up to 60 reviews (30 positive, 30 negative). If OpenAI fails, fallback categories are used.
-   **Google Play Scraper**: `google-play-scraper` fetches up to 500 reviews and app metadata.
-   **Apple App Store Scraper**: `app-store-scraper` paginates to collect up to 500 reviews and app metadata.