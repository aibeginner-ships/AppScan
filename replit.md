# AppScan v3.1 - App Review Summarizer with Semantic Clustering

## Overview

AppScan is a web application designed to analyze user reviews from Google Play Store and Apple App Store. It provides instant, AI-powered insights, including sentiment percentages, monthly trends, categorized feedback, rating analysis, and a list of top negative reviews. **Version 3.1 introduces semantic clustering** to generate 3-5 unique, distinct actionable insights with per-cluster metrics, impact/confidence scoring, and enforced uniqueness. The project aims to give users clear understanding of what customers appreciate and dislike about their applications.

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

### Insight Generation System (v3.1)

**Version 3.1** introduces a semantic clustering pipeline to generate 3-5 unique, distinct actionable insights:

1. **Semantic Clustering** (`semanticClusterer.ts`):
   - Primary: LLM-based clustering using OpenAI chat completions to identify 3-5 semantic themes
   - Fallback: Keyword-based clustering using 7 predefined categories (crashes, performance, login, pricing, features, UI, support)
   - Ensures distributed cluster assignment across reviews

2. **Insight Refinement** (`insightRefiner.ts`):
   - Per-cluster insight generation with OpenAI
   - Keyword extraction fallback for titles when OpenAI fails (`generateTitleFromReviews`)
   - **Uniqueness enforcement**: Post-processing ensures no duplicate titles/actions
   - Appends differentiators when titles collide: "(Part 2)", "Issues", "Problems"
   - Per-cluster metrics calculation: mentions, share (%), negative_ratio
   - Impact scoring (High/Medium/Low) based on share and negativity
   - Confidence scoring (High/Medium/Low) based on review count

3. **ML Utilities** (`utils/ml.ts`):
   - Cosine similarity calculation
   - K-means clustering (available for future embeddings-based clustering)

**Key Improvements**:
- Semantically distinct insights (no duplicates)
- Accurate per-cluster metrics (not global averages)
- Impact and confidence scoring
- Robust multi-level fallback system

### UI/UX Design

The design prioritizes clarity and information density with a clean, minimal interface. A custom color scheme includes blue for primary actions, green for positive, red for negative, and yellow for insights, all with full dark mode support. Typography uses Inter for body text and JetBrains Mono for data. Components feature rounded corners, color-coded badges, and clear loading/error states.

## External Dependencies

-   **AI Integration**: **OpenAI** via Replit AI Integrations (using `gpt-5-mini`) for cost-effective topic extraction from up to 60 reviews (30 positive, 30 negative). If OpenAI fails, fallback categories are used.
-   **Google Play Scraper**: `google-play-scraper` fetches up to 500 reviews and app metadata.
-   **Apple App Store Scraper**: `app-store-scraper` paginates to collect up to 500 reviews and app metadata.