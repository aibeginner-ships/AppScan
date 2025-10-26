import type { Express } from "express";
import { createServer, type Server } from "http";
import gplay from "google-play-scraper";
import appStoreScraper from "app-store-scraper";
import { analyzeReviews } from "./analyzer";
import { z } from "zod";

const analyzeRequestSchema = z.object({
  url: z.string().url(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/analyze", async (req, res) => {
    try {
      // Validate request
      const { url } = analyzeRequestSchema.parse(req.body);

      // Detect platform
      const isGooglePlay = url.includes("play.google.com");
      const isAppStore = url.includes("apps.apple.com");

      if (!isGooglePlay && !isAppStore) {
        return res.status(400).json({ 
          error: "Invalid URL. Please provide a Google Play or Apple App Store link." 
        });
      }

      let reviews: any[] = [];
      let appName = "";
      let storeName = "";

      if (isGooglePlay) {
        // Extract app ID from Google Play URL
        const appIdMatch = url.match(/id=([^&]+)/);
        if (!appIdMatch) {
          return res.status(400).json({ error: "Invalid Google Play URL" });
        }
        const appId = appIdMatch[1];

        // Fetch app details
        const appDetails = await gplay.app({ appId });
        appName = appDetails.title;
        storeName = "Google Play";

        // Fetch reviews (up to 500)
        const reviewsResult = await gplay.reviews({
          appId,
          sort: gplay.sort.NEWEST,
          num: 500,
        });
        reviews = reviewsResult.data;

      } else if (isAppStore) {
        // Extract app ID from App Store URL
        const appIdMatch = url.match(/id(\d+)/);
        if (!appIdMatch) {
          return res.status(400).json({ error: "Invalid App Store URL" });
        }
        const appId = appIdMatch[1];

        // Fetch app details
        const appDetails = await appStoreScraper.app({ id: appId });
        appName = appDetails.title;
        storeName = "Apple App Store";

        // Fetch reviews (paginate to get up to 500)
        reviews = [];
        let page = 1;
        const maxReviews = 500;
        const maxPages = 10; // App Store typically allows up to 10 pages

        while (reviews.length < maxReviews && page <= maxPages) {
          try {
            const pageReviews = await appStoreScraper.reviews({
              id: appId,
              page,
              country: 'us',
            });
            
            if (!pageReviews || pageReviews.length === 0) {
              break; // No more reviews available
            }
            
            reviews.push(...pageReviews);
            page++;
          } catch (error) {
            console.error(`Error fetching page ${page}:`, error);
            break; // Stop on error
          }
        }

        // Trim to max 500 reviews
        reviews = reviews.slice(0, maxReviews);
      }

      if (!reviews || reviews.length === 0) {
        return res.status(404).json({ 
          error: "No reviews found for this app. The app might be new or have no public reviews." 
        });
      }

      // Normalize review format
      const normalizedReviews = reviews.map((review) => ({
        text: review.text || review.comment || "",
        score: review.score || review.rating || 0,
        date: review.date ? new Date(review.date) : 
              review.updated ? new Date(review.updated) : undefined,
      }));

      // Analyze reviews with OpenAI
      const analysis = await analyzeReviews(normalizedReviews, appName, storeName);

      res.json(analysis);
    } catch (error: any) {
      console.error("Analysis error:", error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid request format" });
      }
      
      res.status(500).json({ 
        error: error.message || "Failed to analyze app reviews. Please try again." 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
