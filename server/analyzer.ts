import { openai } from "./openai";
import { generateInsights, type ReviewWithSentiment as ReviewWithSentimentType } from "./insightGenerator";
import type { AnalysisResult as AnalysisResultType, Insight } from "@shared/schema";

interface Review {
  text: string;
  score: number;
  date?: Date;
}

interface ReviewWithSentiment extends Review {
  sentiment: "positive" | "negative" | "neutral";
}

interface AnalysisResult {
  appName: string;
  store: string;
  averageRating: number;
  totalReviews: number;
  positiveCategories: string[];
  negativeCategories: string[];
  topNegativeReviews: string[];
  positivePercentage: number;
  negativePercentage: number;
  trend: Array<{ month: string; avgRating: number; positive: number; negative: number }>;
  summary: string;
  insights: Insight[];
  whatUsersLove: string[];
  whatUsersHate: string[];
}

export async function analyzeReviews(
  reviews: Review[],
  appName: string,
  store: string
): Promise<AnalysisResult> {
  // Classify sentiment for each review
  const reviewsWithSentiment = classifySentiment(reviews);

  // Calculate average rating
  const averageRating = reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length;

  // Calculate sentiment percentages
  const positiveCount = reviewsWithSentiment.filter(r => r.sentiment === "positive").length;
  const negativeCount = reviewsWithSentiment.filter(r => r.sentiment === "negative").length;
  const positivePercentage = Number(((positiveCount / reviews.length) * 100).toFixed(1));
  const negativePercentage = Number(((negativeCount / reviews.length) * 100).toFixed(1));

  // Calculate trend by grouping reviews by month (with sentiment counts)
  const trend = calculateTrendWithSentiment(reviewsWithSentiment);

  // Generate insight summary
  const summary = generateInsightSummary(trend, appName);

  // Use OpenAI to categorize reviews
  const categories = await categorizeReviews(reviews);

  // Get top negative reviews (lowest rated reviews with text)
  const topNegativeReviews = reviews
    .filter((r) => r.score <= 2 && r.text && r.text.trim().length > 10)
    .sort((a, b) => a.score - b.score)
    .slice(0, 5)
    .map((r) => r.text);

  // Generate actionable insights
  console.log('[ANALYZER] Generating insights for', appName);
  const insightResults = await generateInsights(
    reviewsWithSentiment,
    categories.positive,
    categories.negative,
    appName
  );
  console.log('[ANALYZER] Insight results:', {
    insightsCount: insightResults.insights.length,
    loveCount: insightResults.whatUsersLove.length,
    hateCount: insightResults.whatUsersHate.length,
  });

  return {
    appName,
    store,
    averageRating: Number(averageRating.toFixed(1)),
    totalReviews: reviews.length,
    positiveCategories: categories.positive,
    negativeCategories: categories.negative,
    topNegativeReviews,
    positivePercentage,
    negativePercentage,
    trend,
    summary,
    insights: insightResults.insights,
    whatUsersLove: insightResults.whatUsersLove,
    whatUsersHate: insightResults.whatUsersHate,
  };
}

function classifySentiment(reviews: Review[]): ReviewWithSentiment[] {
  // Classify sentiment based on review score
  // This is fast and accurate since the score itself is a strong sentiment indicator
  return reviews.map(review => ({
    ...review,
    sentiment: review.score >= 4 ? "positive" : 
               review.score <= 2 ? "negative" : 
               "neutral"
  }));
}

function calculateTrendWithSentiment(
  reviews: ReviewWithSentiment[]
): Array<{ month: string; avgRating: number; positive: number; negative: number }> {
  // Group reviews by month
  const monthlyData = new Map<string, {
    ratings: number[];
    positive: number;
    negative: number;
  }>();
  
  reviews.forEach((review) => {
    if (review.date) {
      const date = new Date(review.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { ratings: [], positive: 0, negative: 0 });
      }
      
      const data = monthlyData.get(monthKey)!;
      data.ratings.push(review.score);
      
      if (review.sentiment === "positive") {
        data.positive++;
      } else if (review.sentiment === "negative") {
        data.negative++;
      }
    }
  });

  // Calculate average and sentiment counts for each month and sort
  const trend = Array.from(monthlyData.entries())
    .map(([month, data]) => ({
      month,
      avgRating: Number((data.ratings.reduce((sum, r) => sum + r, 0) / data.ratings.length).toFixed(1)),
      positive: data.positive,
      negative: data.negative,
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6); // Last 6 months

  return trend;
}

function generateInsightSummary(
  trend: Array<{ month: string; avgRating: number; positive: number; negative: number }>,
  appName: string
): string {
  if (trend.length === 0) {
    return `Insufficient data to analyze sentiment trends for ${appName}.`;
  }

  if (trend.length === 1) {
    const { avgRating, positive, negative } = trend[0];
    const total = positive + negative;
    const positivePercent = total > 0 ? Math.round((positive / total) * 100) : 0;
    return `${appName} has an average rating of ${avgRating}⭐ with ${positivePercent}% positive reviews.`;
  }

  // Compare first and last month
  const firstMonth = trend[0];
  const lastMonth = trend[trend.length - 1];
  
  const ratingChange = lastMonth.avgRating - firstMonth.avgRating;
  const firstTotal = firstMonth.positive + firstMonth.negative;
  const lastTotal = lastMonth.positive + lastMonth.negative;
  
  const firstPositivePercent = firstTotal > 0 ? Math.round((firstMonth.positive / firstTotal) * 100) : 0;
  const lastPositivePercent = lastTotal > 0 ? Math.round((lastMonth.positive / lastTotal) * 100) : 0;
  const sentimentChange = lastPositivePercent - firstPositivePercent;

  // Format month names
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  if (Math.abs(ratingChange) < 0.1 && Math.abs(sentimentChange) < 5) {
    return `User sentiment for ${appName} has remained stable at ${lastMonth.avgRating}⭐ with ${lastPositivePercent}% positive reviews.`;
  }

  if (ratingChange > 0.2 || sentimentChange > 5) {
    return `User sentiment for ${appName} improved from ${formatMonth(firstMonth.month)} (${firstMonth.avgRating}⭐, ${firstPositivePercent}% positive) to ${formatMonth(lastMonth.month)} (${lastMonth.avgRating}⭐, ${lastPositivePercent}% positive).`;
  }

  if (ratingChange < -0.2 || sentimentChange < -5) {
    return `User sentiment for ${appName} declined from ${formatMonth(firstMonth.month)} (${firstMonth.avgRating}⭐, ${firstPositivePercent}% positive) to ${formatMonth(lastMonth.month)} (${lastMonth.avgRating}⭐, ${lastPositivePercent}% positive).`;
  }

  return `${appName} maintains an average rating of ${lastMonth.avgRating}⭐ with ${lastPositivePercent}% positive reviews.`;
}

async function categorizeReviews(
  reviews: Review[]
): Promise<{ positive: string[]; negative: string[] }> {
  // Prepare sample reviews for analysis
  const positiveReviews = reviews
    .filter((r) => r.score >= 4 && r.text && r.text.trim().length > 10)
    .slice(0, 50)
    .map((r) => r.text);

  const negativeReviews = reviews
    .filter((r) => r.score <= 2 && r.text && r.text.trim().length > 10)
    .slice(0, 50)
    .map((r) => r.text);

  const prompt = `Analyze these app reviews and extract the main categories/topics being discussed.

Positive reviews (${positiveReviews.length} samples):
${positiveReviews.slice(0, 30).join('\n')}

Negative reviews (${negativeReviews.length} samples):
${negativeReviews.slice(0, 30).join('\n')}

Return a JSON object with two arrays:
- "positive": Top 3-5 categories that users praise (e.g., "UI Design", "Performance", "Features")
- "negative": Top 3-5 categories that users criticize (e.g., "Bugs", "Ads", "Price")

Keep category names short (1-3 words). Focus on the most commonly mentioned topics.

Response format:
{
  "positive": ["Category 1", "Category 2", "Category 3"],
  "negative": ["Category 1", "Category 2", "Category 3"]
}`;

  try {
    // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_completion_tokens: 500,
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");
    
    return {
      positive: result.positive || ["User Experience", "Features", "Design"],
      negative: result.negative || ["Performance", "Bugs", "Issues"],
    };
  } catch (error) {
    console.error("Error analyzing with OpenAI:", error);
    // Fallback categories if OpenAI fails
    return {
      positive: ["User Experience", "Features", "Design"],
      negative: ["Performance", "Bugs", "Price"],
    };
  }
}
