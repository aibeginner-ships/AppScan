/**
 * Insight refinement module for generating precise insights from clustered reviews
 */

import { openai } from './openai.js';
import type { ReviewWithEmbedding } from './semanticClusterer.js';

export interface RefinedInsight {
  title: string;
  why_it_matters: string;
  metrics: {
    mentions: number;
    share: number;
    negative_ratio: number;
  };
  representative_quote: string;
  suggested_action: string;
  impact: 'High' | 'Medium' | 'Low';
  confidence: 'High' | 'Medium' | 'Low';
}

/**
 * Generate a single insight from a cluster of reviews
 */
async function generateInsightForCluster(
  clusterReviews: ReviewWithEmbedding[],
  totalReviews: number
): Promise<RefinedInsight | null> {
  if (clusterReviews.length === 0) {
    return null;
  }

  // Calculate per-cluster metrics
  const mentions = clusterReviews.length;
  const share = mentions / totalReviews;
  const negativeCount = clusterReviews.filter(r => r.sentiment === 'negative').length;
  const negative_ratio = negativeCount / mentions;

  // Take up to 20 reviews for analysis
  const sampleReviews = clusterReviews.slice(0, 20).map(r => r.text);

  const prompt = `You are a product analyst analyzing user feedback.

Here are ${mentions} user reviews that discuss a similar theme:

${sampleReviews.map((text, i) => `${i + 1}. "${text}"`).join('\n')}

Analyze these reviews and provide:
1. A concise, descriptive title (2-4 words) that captures the main issue or theme
2. A 1-2 sentence explanation of why this matters to the product
3. One specific, actionable recommendation
4. Select the most representative quote from the list above (copy it exactly, including quote marks)

Requirements:
- Title should be specific and descriptive (e.g., "Login Crashes", "Slow Search Results", "Missing Features")
- Avoid generic titles like "Performance Issues" or "User Experience Problems"
- Focus on what users are actually saying, not assumptions
- Be direct and actionable
- The representative_quote must be one of the exact reviews from the list above

Return JSON in this exact format:
{
  "title": "Brief Descriptive Title",
  "why_it_matters": "Why this issue matters",
  "suggested_action": "Specific action to take",
  "representative_quote": "Exact quote from the list above"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a product analyst creating actionable insights from user feedback.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      max_completion_tokens: 300,
    });

    const content = completion.choices[0].message.content || '{}';
    const result = JSON.parse(content);

    // Find the representative quote from the samples
    // If OpenAI didn't return it properly, pick the first one
    let representative_quote = result.representative_quote || sampleReviews[0];

    // Clean up the quote (remove surrounding quotes if present)
    representative_quote = representative_quote.replace(/^["']|["']$/g, '');

    // If the quote is not in the sample, use the first review
    const quoteExists = sampleReviews.some(r => r.includes(representative_quote) || representative_quote.includes(r.slice(0, 30)));
    if (!quoteExists) {
      representative_quote = sampleReviews[0];
    }

    // Determine impact and confidence based on metrics
    let impact: 'High' | 'Medium' | 'Low' = 'Low';
    if (share >= 0.15 && negative_ratio >= 0.7) {
      impact = 'High';
    } else if (share >= 0.08 || negative_ratio >= 0.75) {
      impact = 'Medium';
    }

    let confidence: 'High' | 'Medium' | 'Low' = 'Low';
    if (mentions >= 30) {
      confidence = 'High';
    } else if (mentions >= 15) {
      confidence = 'Medium';
    }

    // If OpenAI returned empty/generic title, generate one from the reviews
    let title = result.title;
    if (!title || title === 'User Feedback Theme' || title.length < 3) {
      // Extract key words from reviews to create a title
      title = generateTitleFromReviews(sampleReviews.slice(0, 5));
    }

    // If OpenAI returned empty action, generate one
    let suggested_action = result.suggested_action;
    if (!suggested_action || suggested_action === 'Investigate and address user concerns') {
      suggested_action = `Prioritize fixing issues related to ${title.toLowerCase()}`;
    }

    return {
      title,
      why_it_matters: result.why_it_matters || `This issue affects ${mentions} reviews (${(share * 100).toFixed(1)}% of total)`,
      metrics: {
        mentions,
        share,
        negative_ratio,
      },
      representative_quote,
      suggested_action,
      impact,
      confidence,
    };
  } catch (error) {
    console.error('[INSIGHT REFINER] Error generating insight for cluster:', error);
    return null;
  }
}

/**
 * Generate a title from review text using keyword extraction
 */
function generateTitleFromReviews(reviews: string[]): string {
  // Common issue keywords
  const issueKeywords = [
    'crash', 'freeze', 'bug', 'error', 'broken', 'fail',
    'slow', 'lag', 'performance', 'loading',
    'login', 'account', 'password', 'sign',
    'price', 'cost', 'expensive', 'subscription',
    'feature', 'missing', 'need', 'add',
    'ui', 'design', 'interface', 'confusing',
    'support', 'help', 'customer', 'service',
    'ads', 'advertisement', 'spam',
    'update', 'version', 'change',
    'quality', 'bad', 'terrible', 'awful'
  ];

  // Count keyword frequencies
  const keywordCounts: Record<string, number> = {};
  const text = reviews.join(' ').toLowerCase();

  issueKeywords.forEach(keyword => {
    const count = (text.match(new RegExp(keyword, 'g')) || []).length;
    if (count > 0) {
      keywordCounts[keyword] = count;
    }
  });

  // Get top 2 keywords
  const topKeywords = Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([word]) => word);

  if (topKeywords.length === 0) {
    return 'User Experience Issues';
  }

  // Create title from top keywords
  const titleMap: Record<string, string> = {
    'crash': 'App Crashes',
    'freeze': 'App Freezing',
    'bug': 'Bug Reports',
    'error': 'Error Messages',
    'slow': 'Slow Performance',
    'lag': 'Performance Lag',
    'login': 'Login Issues',
    'price': 'Pricing Concerns',
    'feature': 'Missing Features',
    'ui': 'UI Problems',
    'support': 'Support Issues',
    'ads': 'Ad Complaints',
    'update': 'Update Problems',
    'quality': 'Quality Issues'
  };

  const firstWord = titleMap[topKeywords[0]] || topKeywords[0].charAt(0).toUpperCase() + topKeywords[0].slice(1);
  
  if (topKeywords.length === 1) {
    return firstWord;
  }

  const secondWord = topKeywords[1];
  return `${firstWord} & ${secondWord.charAt(0).toUpperCase()}${secondWord.slice(1)}`;
}

/**
 * Generate refined insights from all clusters
 */
export async function refineInsights(
  clusteredReviews: ReviewWithEmbedding[],
  totalReviews: number
): Promise<RefinedInsight[]> {
  if (clusteredReviews.length === 0) {
    return [];
  }

  // Group reviews by cluster
  const clusterMap: Record<number, ReviewWithEmbedding[]> = {};
  clusteredReviews.forEach(review => {
    const clusterId = review.clusterId!;
    if (!clusterMap[clusterId]) {
      clusterMap[clusterId] = [];
    }
    clusterMap[clusterId].push(review);
  });

  const clusterIds = Object.keys(clusterMap).map(Number);
  console.log(`[INSIGHT REFINER] Generating insights for ${clusterIds.length} clusters`);

  // Generate insights for each cluster in parallel
  const insightPromises = clusterIds.map(clusterId =>
    generateInsightForCluster(clusterMap[clusterId], totalReviews)
  );

  const insights = await Promise.all(insightPromises);

  // Filter out null results
  const validInsights = insights.filter((i): i is RefinedInsight => i !== null);

  // Ensure title uniqueness
  const usedTitles = new Set<string>();
  validInsights.forEach((insight, index) => {
    let title = insight.title;
    let counter = 1;
    
    // If title already used, append differentiator
    while (usedTitles.has(title)) {
      counter++;
      // Get a different aspect from the reviews
      const alternativeTitles = [
        `${insight.title} (Part ${counter})`,
        `${insight.title} Issues`,
        `${insight.title} Problems`,
        `Related to ${insight.title}`,
      ];
      title = alternativeTitles[(counter - 2) % alternativeTitles.length];
    }
    
    usedTitles.add(title);
    insight.title = title;
    
    // Also ensure suggested_action is unique
    if (!insight.suggested_action.includes(title)) {
      insight.suggested_action = `Prioritize fixing issues related to ${title.toLowerCase()}`;
    }
  });

  // Sort by impact -> confidence -> mentions
  const impactOrder = { High: 3, Medium: 2, Low: 1 };
  const confidenceOrder = { High: 3, Medium: 2, Low: 1 };

  validInsights.sort((a, b) => {
    // First by impact
    const impactDiff = impactOrder[b.impact] - impactOrder[a.impact];
    if (impactDiff !== 0) return impactDiff;

    // Then by confidence
    const confidenceDiff = confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
    if (confidenceDiff !== 0) return confidenceDiff;

    // Finally by mentions
    return b.metrics.mentions - a.metrics.mentions;
  });

  console.log(`[INSIGHT REFINER] Generated ${validInsights.length} refined insights with unique titles`);

  // Return top 3-5 insights
  return validInsights.slice(0, 5);
}
