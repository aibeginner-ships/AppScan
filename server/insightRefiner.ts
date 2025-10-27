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
 * Calculate text similarity using Jaccard index (intersection over union)
 * Returns a value between 0 (no similarity) and 1 (identical)
 */
function textSimilarity(text1: string, text2: string): number {
  // Tokenize and normalize
  const tokens1 = new Set(
    text1
      .toLowerCase()
      .split(/\W+/)
      .filter(t => t.length > 2) // Filter out very short tokens
  );
  const tokens2 = new Set(
    text2
      .toLowerCase()
      .split(/\W+/)
      .filter(t => t.length > 2)
  );

  if (tokens1.size === 0 || tokens2.size === 0) {
    return 0;
  }

  // Calculate intersection
  const intersection = Array.from(tokens1).filter(token => tokens2.has(token));
  
  // Calculate union
  const union = new Set([...Array.from(tokens1), ...Array.from(tokens2)]);

  // Return Jaccard similarity
  return intersection.length / union.size;
}

/**
 * Select the most representative quote from reviews using text similarity
 */
function selectRepresentativeQuote(
  reviews: string[],
  clusterSummary: string
): string {
  if (reviews.length === 0) {
    return '';
  }

  if (reviews.length === 1) {
    return reviews[0];
  }

  // Find the review with highest similarity to the cluster summary
  let bestQuote = reviews[0];
  let bestScore = 0;

  for (const review of reviews) {
    const score = textSimilarity(review, clusterSummary);
    if (score > bestScore) {
      bestScore = score;
      bestQuote = review;
    }
  }

  return bestQuote;
}

/**
 * Extract top keywords from reviews
 */
function extractTopKeywords(reviews: string[], count: number = 3): string[] {
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

  const keywordCounts: Record<string, number> = {};
  const text = reviews.join(' ').toLowerCase();

  issueKeywords.forEach(keyword => {
    const matches = text.match(new RegExp(`\\b${keyword}\\b`, 'g'));
    if (matches) {
      keywordCounts[keyword] = matches.length;
    }
  });

  return Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([word]) => word);
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

  // Extract top keywords to provide context
  const topKeywords = extractTopKeywords(sampleReviews, 3);
  const keywordContext = topKeywords.length > 0 
    ? `Top keywords: "${topKeywords.join('", "')}"`
    : '';

  const prompt = `You are a product manager analyzing app reviews.

${keywordContext}

Here are ${mentions} user reviews that discuss a similar theme:

${sampleReviews.map((text, i) => `${i + 1}. "${text}"`).join('\n')}

Analyze these reviews and provide:
1. A concise, descriptive title (2-4 words) that captures the specific issue or theme
2. A 1-2 sentence explanation of why this matters to the product
3. One SHORT, SPECIFIC, actionable improvement suggestion (max 15 words)

Requirements:
- Title should be specific and descriptive (e.g., "Login Crashes", "Slow Search Results", "Missing Filters")
- Avoid generic titles like "Performance Issues" or "User Experience Problems"
- Suggested action must be concrete and specific (e.g., "Fix login crash in version 5.3 for Android 13 users")
- Focus on what users are actually saying, not assumptions
- Be direct and actionable

Return JSON in this exact format:
{
  "title": "Brief Descriptive Title",
  "why_it_matters": "Why this issue matters",
  "suggested_action": "Specific action to take (max 15 words)"
}

Example good suggested_action: "Fix login freeze affecting iOS 16+ users after v5.2 update"
Example bad suggested_action: "Investigate and address user concerns about login"`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a product manager creating actionable insights from user feedback. Be specific and concrete.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      max_completion_tokens: 300,
    });

    const content = completion.choices[0].message.content || '{}';
    const result = JSON.parse(content);

    // If OpenAI returned empty/generic title, generate one from the reviews
    let title = result.title;
    if (!title || title === 'User Feedback Theme' || title.length < 3) {
      // Extract key words from reviews to create a title
      title = generateTitleFromReviews(sampleReviews.slice(0, 5));
    }

    // Check if OpenAI returned a meaningful suggested_action
    let suggested_action = result.suggested_action || '';
    
    // Detect generic/empty actions
    const isGenericAction = 
      !suggested_action ||
      suggested_action.length < 10 ||
      suggested_action.toLowerCase().includes('investigate') ||
      suggested_action.toLowerCase().includes('address user concerns') ||
      suggested_action.toLowerCase().includes('improve') && suggested_action.length < 25;

    if (isGenericAction) {
      // Generate specific action based on title and top keywords
      const keywords = extractTopKeywords(sampleReviews, 2);
      suggested_action = generateSpecificAction(title, keywords);
    }

    // Use text similarity to select the most representative quote
    // Combine title and why_it_matters to create a summary for comparison
    const clusterSummary = `${title}. ${result.why_it_matters || ''}`;
    const representative_quote = selectRepresentativeQuote(sampleReviews, clusterSummary);

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
 * Generate a specific, actionable suggestion based on title and keywords
 */
function generateSpecificAction(title: string, keywords: string[]): string {
  const titleLower = title.toLowerCase();
  
  // Map common issues to specific actions
  if (titleLower.includes('crash') || titleLower.includes('freeze') || titleLower.includes('bug')) {
    return `Fix crash/freeze bugs affecting users in latest version`;
  }
  
  if (titleLower.includes('slow') || titleLower.includes('performance') || titleLower.includes('lag')) {
    return `Optimize performance and reduce loading times for better UX`;
  }
  
  if (titleLower.includes('login') || titleLower.includes('account') || titleLower.includes('password')) {
    return `Improve login flow and fix authentication issues`;
  }
  
  if (titleLower.includes('ad') && (titleLower.includes('complaint') || titleLower.includes('spam'))) {
    return `Reduce ad frequency and improve ad placement for free users`;
  }
  
  if (titleLower.includes('price') || titleLower.includes('cost') || titleLower.includes('subscription')) {
    return `Review pricing structure and communicate value more clearly`;
  }
  
  if (titleLower.includes('feature') || titleLower.includes('missing')) {
    return `Prioritize adding most-requested features from user feedback`;
  }
  
  if (titleLower.includes('ui') || titleLower.includes('design') || titleLower.includes('interface')) {
    return `Simplify UI/UX and improve navigation based on user feedback`;
  }
  
  if (titleLower.includes('support') || titleLower.includes('help') || titleLower.includes('customer')) {
    return `Improve customer support response time and quality`;
  }
  
  if (titleLower.includes('update') && keywords.includes('change')) {
    return `Restore user-friendly features removed in recent updates`;
  }
  
  // Generic fallback with keywords
  if (keywords.length > 0) {
    return `Address ${keywords[0]}-related issues mentioned by users`;
  }
  
  return `Fix reported issues with ${titleLower}`;
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

  // Ensure title and action uniqueness
  const usedTitles = new Set<string>();
  const usedActions = new Set<string>();
  
  validInsights.forEach((insight) => {
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
    
    // Ensure suggested_action is unique (append variant if duplicate)
    let action = insight.suggested_action;
    let actionCounter = 1;
    
    while (usedActions.has(action)) {
      actionCounter++;
      // Add a slight variation to make it unique
      action = `${insight.suggested_action} (priority ${actionCounter})`;
    }
    
    usedActions.add(action);
    insight.suggested_action = action;
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
