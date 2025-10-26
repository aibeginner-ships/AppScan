import { openai } from "./openai";

interface Review {
  text: string;
  score: number;
  date?: Date;
}

interface AnalysisResult {
  appName: string;
  store: string;
  averageRating: number;
  totalReviews: number;
  positiveCategories: string[];
  negativeCategories: string[];
  topNegativeReviews: string[];
  trend: Array<{ month: string; avgRating: number }>;
}

export async function analyzeReviews(
  reviews: Review[],
  appName: string,
  store: string
): Promise<AnalysisResult> {
  // Calculate average rating
  const averageRating = reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length;

  // Calculate trend by grouping reviews by month
  const trend = calculateTrend(reviews);

  // Use OpenAI to categorize reviews
  const categories = await categorizeReviews(reviews);

  // Get top negative reviews (lowest rated reviews with text)
  const topNegativeReviews = reviews
    .filter((r) => r.score <= 2 && r.text && r.text.trim().length > 10)
    .sort((a, b) => a.score - b.score)
    .slice(0, 5)
    .map((r) => r.text);

  return {
    appName,
    store,
    averageRating: Number(averageRating.toFixed(1)),
    totalReviews: reviews.length,
    positiveCategories: categories.positive,
    negativeCategories: categories.negative,
    topNegativeReviews,
    trend,
  };
}

function calculateTrend(reviews: Review[]): Array<{ month: string; avgRating: number }> {
  // Group reviews by month
  const monthlyRatings = new Map<string, number[]>();
  
  reviews.forEach((review) => {
    if (review.date) {
      const date = new Date(review.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyRatings.has(monthKey)) {
        monthlyRatings.set(monthKey, []);
      }
      monthlyRatings.get(monthKey)!.push(review.score);
    }
  });

  // Calculate average for each month and sort
  const trend = Array.from(monthlyRatings.entries())
    .map(([month, ratings]) => ({
      month,
      avgRating: Number((ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1)),
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6); // Last 6 months

  return trend;
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
