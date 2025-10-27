import { openai } from "./openai";
import { clusterNegativeReviews } from "./semanticClusterer.js";
import { refineInsights } from "./insightRefiner.js";

export interface ReviewWithSentiment {
  text: string;
  score: number;
  date?: Date;
  sentiment: "positive" | "negative" | "neutral";
}

export interface ThemeData {
  topic: string;
  mentions: number;
  negativeRatio: number;
  recentTrend: number;
  score: number;
  reviews: ReviewWithSentiment[];
}

export interface InsightMetrics {
  mentions: number;
  share: number;
  negative_ratio: number;
}

export interface Insight {
  title: string;
  why_it_matters: string;
  metrics: InsightMetrics;
  representative_quote: string;
  suggested_action: string;
  impact?: 'High' | 'Medium' | 'Low';
  confidence?: 'High' | 'Medium' | 'Low';
}

export interface LoveHateSummary {
  love: string[];
  hate: string[];
}

export interface InsightGenerationResult {
  insights: Insight[];
  whatUsersLove: string[];
  whatUsersHate: string[];
}

/**
 * Ranks themes by computing a weighted score based on:
 * - Volume (50%): How many times the theme is mentioned
 * - Negative ratio (35%): What percentage of mentions are negative
 * - Recency (15%): Whether mentions are trending up in recent reviews
 */
export function rankThemes(
  reviews: ReviewWithSentiment[],
  positiveCategories: string[],
  negativeCategories: string[]
): ThemeData[] {
  const allCategories = [
    ...positiveCategories.map(cat => ({ category: cat, sentiment: "positive" as const })),
    ...negativeCategories.map(cat => ({ category: cat, sentiment: "negative" as const }))
  ];

  const themeMap = new Map<string, {
    mentions: number;
    negativeCount: number;
    recentCount: number;
    reviews: ReviewWithSentiment[];
  }>();

  // Calculate cutoff date for "recent" reviews (last 30 days)
  const now = Date.now();
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

  // For each category, find related reviews based on text matching
  allCategories.forEach(({ category, sentiment }) => {
    const keywords = category.toLowerCase().split(/\s+/);
    
    reviews.forEach(review => {
      const text = review.text.toLowerCase();
      const matchesKeyword = keywords.some(keyword => text.includes(keyword));
      
      if (matchesKeyword) {
        if (!themeMap.has(category)) {
          themeMap.set(category, {
            mentions: 0,
            negativeCount: 0,
            recentCount: 0,
            reviews: []
          });
        }
        
        const data = themeMap.get(category)!;
        data.mentions++;
        data.reviews.push(review);
        
        if (review.sentiment === "negative") {
          data.negativeCount++;
        }
        
        if (review.date && review.date.getTime() > thirtyDaysAgo) {
          data.recentCount++;
        }
      }
    });
  });

  // Calculate scores and normalize
  const themes: ThemeData[] = [];
  const maxMentions = Math.max(...Array.from(themeMap.values()).map(d => d.mentions), 1);
  const maxRecent = Math.max(...Array.from(themeMap.values()).map(d => d.recentCount), 1);

  themeMap.forEach((data, topic) => {
    const normalizedVolume = data.mentions / maxMentions;
    const negativeRatio = data.mentions > 0 ? data.negativeCount / data.mentions : 0;
    const recentTrend = data.recentCount / maxRecent;

    // Weighted formula: 50% volume + 35% negative ratio + 15% recency
    const score = (0.5 * normalizedVolume) + (0.35 * negativeRatio) + (0.15 * recentTrend);

    themes.push({
      topic,
      mentions: data.mentions,
      negativeRatio,
      recentTrend,
      score,
      reviews: data.reviews
    });
  });

  // Sort by score descending and return top themes
  return themes.sort((a, b) => b.score - a.score);
}

/**
 * Generates love/hate summaries using OpenAI
 */
export async function generateLoveHateSummaries(
  reviews: ReviewWithSentiment[]
): Promise<LoveHateSummary> {
  const positiveTexts = reviews
    .filter(r => r.sentiment === "positive" && r.text && r.text.trim().length > 10)
    .map(r => r.text)
    .slice(0, 200);

  const negativeTexts = reviews
    .filter(r => r.sentiment === "negative" && r.text && r.text.trim().length > 10)
    .map(r => r.text)
    .slice(0, 200);

  if (positiveTexts.length === 0 && negativeTexts.length === 0) {
    return {
      love: ["Insufficient review data"],
      hate: ["Insufficient review data"]
    };
  }

  const prompt = `Analyze the following user feedback and create concise bullet-point summaries.

Positive reviews (${positiveTexts.length} samples):
${positiveTexts.slice(0, 100).join('\n---\n')}

Negative reviews (${negativeTexts.length} samples):
${negativeTexts.slice(0, 100).join('\n---\n')}

Create exactly 3 bullet points for "What users love" and 3 for "What users hate".
Each bullet should be:
- Concise (10-15 words max)
- Specific and data-backed
- Action-oriented where possible

Return as JSON:
{
  "love": ["bullet 1", "bullet 2", "bullet 3"],
  "hate": ["bullet 1", "bullet 2", "bullet 3"]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        { role: "system", content: "You are a product analyst summarizing user feedback." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 500,
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");
    
    return {
      love: result.love || ["Great user experience", "Intuitive design", "Reliable performance"],
      hate: result.hate || ["Occasional bugs", "Price concerns", "Feature requests"]
    };
  } catch (error) {
    console.error("Error generating love/hate summaries:", error);
    return {
      love: ["Great user experience", "Intuitive design", "Reliable performance"],
      hate: ["Occasional bugs", "Price concerns", "Feature requests"]
    };
  }
}

/**
 * Generates actionable insights using semantic clustering (v3.1)
 * This replaces the old keyword-based approach with embeddings + k-means
 */
export async function generateActionableInsights(
  reviews: ReviewWithSentiment[],
  totalReviews: number,
  negativeCategories: string[]
): Promise<Insight[]> {
  console.log('[INSIGHT GEN] Starting semantic clustering approach...');
  
  try {
    // Step 1: Cluster negative reviews by semantic similarity
    const clusteredReviews = await clusterNegativeReviews(reviews);
    
    if (clusteredReviews.length === 0) {
      console.log('[INSIGHT GEN] No negative reviews to cluster');
      return [];
    }

    console.log(`[INSIGHT GEN] Clustered ${clusteredReviews.length} negative reviews`);

    // Step 2: Generate refined insights from clusters
    const refinedInsights = await refineInsights(clusteredReviews, totalReviews);
    
    console.log(`[INSIGHT GEN] Generated ${refinedInsights.length} semantic insights`);
    
    return refinedInsights;
  } catch (error) {
    console.error('[INSIGHT GEN] Error in semantic clustering, falling back to category-based insights:', error);
    
    // Fallback: create basic insights from categories
    const negativeReviews = reviews
      .filter(r => r.sentiment === "negative" && r.text && r.text.trim().length > 10)
      .map(r => r.text);
    
    if (negativeReviews.length === 0) {
      return [];
    }
    
    const fallbackInsights = negativeCategories.slice(0, 3).map((category, index) => ({
      title: `Address ${category} issues`,
      why_it_matters: `${category} is a major pain point mentioned in user reviews`,
      metrics: {
        mentions: Math.floor(negativeReviews.length / negativeCategories.length),
        share: 0.1,
        negative_ratio: 0.8
      },
      representative_quote: negativeReviews[index] || "Users have reported issues with this aspect",
      suggested_action: `Investigate and improve ${category.toLowerCase()}`,
      impact: 'Medium' as const,
      confidence: 'Low' as const
    }));
    
    console.log('[INSIGHT GEN] Generated', fallbackInsights.length, 'fallback insights');
    return fallbackInsights;
  }
}

/**
 * Main function to generate all insights (v3.1 with semantic clustering)
 */
export async function generateInsights(
  reviews: ReviewWithSentiment[],
  positiveCategories: string[],
  negativeCategories: string[],
  appName: string
): Promise<InsightGenerationResult> {
  console.log('[INSIGHT GEN] Starting v3.1 insight generation with semantic clustering');
  console.log('[INSIGHT GEN] Reviews:', reviews.length, 'Positive cats:', positiveCategories.length, 'Negative cats:', negativeCategories.length);
  
  // Generate love/hate summaries
  console.log('[INSIGHT GEN] Generating love/hate summaries...');
  const loveHate = await generateLoveHateSummaries(reviews);
  console.log('[INSIGHT GEN] Love/hate generated:', loveHate.love.length, 'love,', loveHate.hate.length, 'hate');
  
  // Generate actionable insights using semantic clustering
  console.log('[INSIGHT GEN] Generating semantic insights...');
  const insights = await generateActionableInsights(
    reviews, 
    reviews.length,
    negativeCategories
  );
  console.log('[INSIGHT GEN] Semantic insights generated:', insights.length);

  return {
    insights,
    whatUsersLove: loveHate.love,
    whatUsersHate: loveHate.hate
  };
}
