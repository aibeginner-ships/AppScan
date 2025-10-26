import { z } from "zod";

// Analysis result schema
export const analysisResultSchema = z.object({
  appName: z.string(),
  store: z.string(),
  averageRating: z.number(),
  totalReviews: z.number(),
  positiveCategories: z.array(z.string()),
  negativeCategories: z.array(z.string()),
  topNegativeReviews: z.array(z.string()),
  trend: z.array(z.object({
    month: z.string(),
    avgRating: z.number(),
  })),
});

export type AnalysisResult = z.infer<typeof analysisResultSchema>;

// Analysis request schema
export const analysisRequestSchema = z.object({
  url: z.string().url(),
});

export type AnalysisRequest = z.infer<typeof analysisRequestSchema>;
