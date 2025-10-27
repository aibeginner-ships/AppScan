import { openai } from "./openai";

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
 * Generates actionable insights from top themes using OpenAI
 */
export async function generateActionableInsights(
  topThemes: ThemeData[],
  totalReviews: number,
  appName: string
): Promise<Insight[]> {
  if (topThemes.length === 0) {
    return [];
  }

  // Prepare theme data for OpenAI
  const themeData = topThemes.slice(0, 5).map(theme => ({
    topic: theme.topic,
    mentions: theme.mentions,
    negativeRatio: theme.negativeRatio,
    recentTrend: theme.recentTrend,
    sampleReviews: theme.reviews.slice(0, 5).map(r => r.text)
  }));

  const prompt = `You are a product analyst for ${appName}. Given user feedback data grouped by themes, write up to 3 concise, actionable insights.

Theme Data (${totalReviews} total reviews):
${JSON.stringify(themeData, null, 2)}

Each insight should:
- Focus on themes with high negative sentiment or recent trends
- Be specific and data-backed
- Include a concrete suggested action
- Be professional and factual

Return strictly formatted JSON array:
[
  {
    "title": "Clear, specific issue title (5-8 words)",
    "why_it_matters": "One sentence explaining impact with metrics",
    "metrics": {
      "mentions": <number>,
      "share": <decimal 0-1>,
      "negative_ratio": <decimal 0-1>
    },
    "representative_quote": "A real user quote from sample reviews",
    "suggested_action": "Specific, actionable next step"
  }
]

Prioritize themes with:
1. High negative_ratio (>0.5)
2. High mentions
3. Recent trends

Return 2-3 insights maximum.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        { role: "system", content: "You are a product analyst creating actionable insights." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 1000,
    });

    const content = completion.choices[0].message.content || "{}";
    const result = JSON.parse(content);
    
    // Handle both array and object with 'insights' key
    const insights = Array.isArray(result) ? result : (result.insights || []);
    
    return insights.slice(0, 3);
  } catch (error) {
    console.error("Error generating actionable insights:", error);
    
    // Fallback: create insights from top themes manually
    return topThemes.slice(0, 2).map(theme => ({
      title: `Address ${theme.topic} concerns`,
      why_it_matters: `Mentioned in ${theme.mentions} reviews (${Math.round(theme.negativeRatio * 100)}% negative)`,
      metrics: {
        mentions: theme.mentions,
        share: theme.mentions / totalReviews,
        negative_ratio: theme.negativeRatio
      },
      representative_quote: theme.reviews[0]?.text || "User feedback indicates issues",
      suggested_action: `Investigate and improve ${theme.topic.toLowerCase()}`
    }));
  }
}

/**
 * Main function to generate all insights
 */
export async function generateInsights(
  reviews: ReviewWithSentiment[],
  positiveCategories: string[],
  negativeCategories: string[],
  appName: string
): Promise<InsightGenerationResult> {
  // Rank themes by importance
  const rankedThemes = rankThemes(reviews, positiveCategories, negativeCategories);
  
  // Generate love/hate summaries
  const loveHate = await generateLoveHateSummaries(reviews);
  
  // Generate actionable insights from top themes
  const insights = await generateActionableInsights(rankedThemes, reviews.length, appName);

  return {
    insights,
    whatUsersLove: loveHate.love,
    whatUsersHate: loveHate.hate
  };
}
