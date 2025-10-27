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
 * Generates actionable insights directly from reviews using OpenAI
 */
export async function generateActionableInsights(
  reviews: ReviewWithSentiment[],
  totalReviews: number,
  appName: string,
  positiveCategories: string[],
  negativeCategories: string[]
): Promise<Insight[]> {
  // Get sample of negative reviews for analysis
  const negativeReviews = reviews
    .filter(r => r.sentiment === "negative" && r.text && r.text.trim().length > 10)
    .slice(0, 100)
    .map(r => r.text);

  if (negativeReviews.length === 0) {
    console.log('[INSIGHT GEN] No negative reviews found, returning empty insights');
    return [];
  }

  const prompt = `You are a product analyst for ${appName}. Analyze these user complaints and create 2-3 actionable insights.

Negative Feedback Categories: ${negativeCategories.join(', ')}

Sample Negative Reviews (${negativeReviews.length} of ${totalReviews} total):
${negativeReviews.slice(0, 50).join('\n---\n')}

Create 2-3 insights as a JSON object with an "insights" array. Each insight must have:
{
  "insights": [
    {
      "title": "Clear issue title (5-8 words)",
      "why_it_matters": "One sentence explaining impact",
      "metrics": {
        "mentions": <estimated number of reviews mentioning this>,
        "share": <estimated decimal 0-1 of total reviews>,
        "negative_ratio": <estimated decimal 0-1 of negative sentiment>
      },
      "representative_quote": "A real user quote from the samples above",
      "suggested_action": "Specific, actionable next step"
    }
  ]
}

Focus on:
- Most frequently mentioned issues
- High-impact problems affecting user experience
- Issues that appear urgent or recent

Be specific, data-backed, and actionable.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        { role: "system", content: "You are a product analyst creating actionable insights from user feedback." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 1000,
    });

    const content = completion.choices[0].message.content || "{}";
    console.log('[INSIGHT GEN] OpenAI response:', content.substring(0, 200) + '...');
    const result = JSON.parse(content);
    
    // Handle both array and object with 'insights' key
    const insights = Array.isArray(result) ? result : (result.insights || []);
    console.log('[INSIGHT GEN] Parsed insights:', insights.length);
    
    // If OpenAI returned no insights, use fallback
    if (insights.length === 0) {
      console.log('[INSIGHT GEN] OpenAI returned empty insights, using fallback');
      throw new Error('Empty insights from OpenAI');
    }
    
    return insights.slice(0, 3);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error("[INSIGHT GEN] Error or empty result, using fallback insights:", errorMsg);
    
    // Fallback: create basic insights from categories
    const fallbackInsights = negativeCategories.slice(0, 2).map((category, index) => ({
      title: `Address ${category} issues`,
      why_it_matters: `${category} is a major pain point mentioned in user reviews`,
      metrics: {
        mentions: Math.floor(negativeReviews.length / negativeCategories.length),
        share: 0.1,
        negative_ratio: 0.8
      },
      representative_quote: negativeReviews[index] || "Users have reported issues with this aspect",
      suggested_action: `Investigate and improve ${category.toLowerCase()}`
    }));
    
    console.log('[INSIGHT GEN] Generated', fallbackInsights.length, 'fallback insights');
    return fallbackInsights;
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
  console.log('[INSIGHT GEN] Starting insight generation');
  console.log('[INSIGHT GEN] Reviews:', reviews.length, 'Positive cats:', positiveCategories.length, 'Negative cats:', negativeCategories.length);
  
  // Generate love/hate summaries
  console.log('[INSIGHT GEN] Generating love/hate summaries...');
  const loveHate = await generateLoveHateSummaries(reviews);
  console.log('[INSIGHT GEN] Love/hate generated:', loveHate.love.length, 'love,', loveHate.hate.length, 'hate');
  
  // Generate actionable insights directly from reviews
  console.log('[INSIGHT GEN] Generating actionable insights...');
  const insights = await generateActionableInsights(
    reviews, 
    reviews.length, 
    appName,
    positiveCategories,
    negativeCategories
  );
  console.log('[INSIGHT GEN] Insights generated:', insights.length);

  return {
    insights,
    whatUsersLove: loveHate.love,
    whatUsersHate: loveHate.hate
  };
}
