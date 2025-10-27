import { z } from "zod";

// Insight schema
export const insightSchema = z.object({
  title: z.string(),
  why_it_matters: z.string(),
  metrics: z.object({
    mentions: z.number(),
    share: z.number(),
    negative_ratio: z.number(),
  }),
  representative_quote: z.string(),
  quote_similarity: z.number(),
  suggested_action: z.string(),
  impact: z.enum(['High', 'Medium', 'Low']),
  confidence: z.enum(['High', 'Medium', 'Low']),
});

export type Insight = z.infer<typeof insightSchema>;

// Analysis result schema
export const analysisResultSchema = z.object({
  appName: z.string(),
  store: z.string(),
  averageRating: z.number(),
  totalReviews: z.number(),
  positiveCategories: z.array(z.string()),
  negativeCategories: z.array(z.string()),
  topNegativeReviews: z.array(z.string()),
  positivePercentage: z.number(),
  negativePercentage: z.number(),
  trend: z.array(z.object({
    month: z.string(),
    avgRating: z.number(),
    positive: z.number(),
    negative: z.number(),
  })),
  summary: z.string(),
  insights: z.array(insightSchema),
  whatUsersLove: z.array(z.string()),
  whatUsersHate: z.array(z.string()),
});

export type AnalysisResult = z.infer<typeof analysisResultSchema>;

// Analysis request schema
export const analysisRequestSchema = z.object({
  url: z.string().url(),
});

export type AnalysisRequest = z.infer<typeof analysisRequestSchema>;
