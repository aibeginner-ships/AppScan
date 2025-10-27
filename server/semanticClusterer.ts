/**
 * Semantic clustering module for grouping reviews by theme
 * Uses OpenAI chat completion for clustering instead of embeddings
 */

import { openai } from './openai.js';

export interface ReviewWithEmbedding {
  text: string;
  score: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  embedding: number[]; // Empty array (not using embeddings)
  clusterId?: number;
}

/**
 * Cluster reviews using OpenAI to identify semantic themes
 * This approach uses chat completion instead of embeddings API
 */
export async function clusterReviews(
  reviews: { text: string; score: number; sentiment: 'positive' | 'negative' | 'neutral' }[],
  k?: number
): Promise<ReviewWithEmbedding[]> {
  if (reviews.length === 0) {
    return [];
  }

  console.log(`[SEMANTIC CLUSTERER] Clustering ${reviews.length} reviews using LLM-based approach`);

  // Auto-determine k if not specified
  if (!k) {
    if (reviews.length < 20) {
      k = 2;
    } else if (reviews.length < 50) {
      k = 3;
    } else if (reviews.length < 100) {
      k = 4;
    } else {
      k = 5;
    }
  }

  console.log(`[SEMANTIC CLUSTERER] Targeting k=${k} clusters`);

  try {
    // Take a sample of reviews for clustering (limit to 80 to save tokens)
    const sampleSize = Math.min(80, reviews.length);
    const sampleReviews = reviews.slice(0, sampleSize);

    const prompt = `Analyze these ${sampleSize} user reviews and group them into ${k} distinct semantic themes/topics.

Reviews:
${sampleReviews.map((r, i) => `${i}. "${r.text}"`).join('\n')}

Identify ${k} main themes and assign each review (by index 0-${sampleSize - 1}) to the most relevant theme.

Return JSON:
{
  "themes": [
    {
      "name": "Brief theme name (2-4 words)",
      "review_indices": [list of review indices 0-${sampleSize - 1}]
    }
  ]
}

Each review should be assigned to exactly one theme. Make themes distinct and meaningful.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a data analyst clustering user reviews into semantic themes.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      max_completion_tokens: 1000,
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    const themes = result.themes || [];

    console.log(`[SEMANTIC CLUSTERER] OpenAI identified ${themes.length} themes`);

    // If OpenAI returned no themes or invalid response, use keyword-based clustering
    if (themes.length === 0 || !Array.isArray(themes)) {
      console.log('[SEMANTIC CLUSTERER] LLM returned no themes, using keyword-based clustering');
      return keywordBasedClustering(reviews, k);
    }

    // Create clusterId mapping
    const clusterMap: number[] = new Array(reviews.length).fill(0);

    themes.forEach((theme: any, themeIdx: number) => {
      const indices: number[] = theme.review_indices || [];
      indices.forEach((idx: number) => {
        if (idx >= 0 && idx < sampleSize) {
          clusterMap[idx] = themeIdx;
        }
      });
    });

    // Assign remaining reviews using round-robin
    for (let i = sampleSize; i < reviews.length; i++) {
      clusterMap[i] = i % themes.length;
    }

    // Count cluster sizes
    const clusterSizes: Record<number, number> = {};
    clusterMap.forEach(clusterId => {
      clusterSizes[clusterId] = (clusterSizes[clusterId] || 0) + 1;
    });

    console.log('[SEMANTIC CLUSTERER] Cluster sizes:', clusterSizes);

    // Return reviews with cluster IDs
    const clusteredReviews: ReviewWithEmbedding[] = reviews.map((review, index) => ({
      ...review,
      embedding: [], // Not using embeddings
      clusterId: clusterMap[index],
    }));

    return clusteredReviews;
  } catch (error) {
    console.error('[SEMANTIC CLUSTERER] Error during LLM clustering:', error);
    console.log('[SEMANTIC CLUSTERER] Using keyword-based fallback clustering');
    
    // Fallback: Use simple keyword-based clustering
    return keywordBasedClustering(reviews, k);
  }
}

/**
 * Fallback clustering using simple keyword matching
 * Ensures we always get multiple distinct clusters
 */
function keywordBasedClustering(
  reviews: { text: string; score: number; sentiment: 'positive' | 'negative' | 'neutral' }[],
  k: number
): ReviewWithEmbedding[] {
  // Define common theme keywords
  const themeKeywords = [
    ['crash', 'freeze', 'bug', 'broken', 'error', 'fail'],
    ['slow', 'lag', 'performance', 'speed', 'loading'],
    ['login', 'account', 'password', 'sign', 'authentication'],
    ['price', 'cost', 'expensive', 'subscription', 'payment', 'money'],
    ['feature', 'missing', 'need', 'add', 'want', 'wish'],
    ['ui', 'design', 'interface', 'layout', 'confusing'],
    ['customer', 'support', 'help', 'service', 'response'],
  ];

  const clusteredReviews: ReviewWithEmbedding[] = [];

  for (const review of reviews) {
    const text = review.text.toLowerCase();
    let assignedCluster = -1;
    let maxMatches = 0;

    // Find best matching theme
    for (let i = 0; i < Math.min(k, themeKeywords.length); i++) {
      const keywords = themeKeywords[i];
      const matches = keywords.filter(keyword => text.includes(keyword)).length;
      
      if (matches > maxMatches) {
        maxMatches = matches;
        assignedCluster = i;
      }
    }

    // If no theme matched, use round-robin
    if (assignedCluster === -1) {
      assignedCluster = clusteredReviews.length % k;
    }

    clusteredReviews.push({
      ...review,
      embedding: [],
      clusterId: assignedCluster,
    });
  }

  // Verify we have multiple clusters
  const clusterSizes: Record<number, number> = {};
  clusteredReviews.forEach(r => {
    clusterSizes[r.clusterId!] = (clusterSizes[r.clusterId!] || 0) + 1;
  });

  console.log('[SEMANTIC CLUSTERER] Keyword-based cluster sizes:', clusterSizes);

  return clusteredReviews;
}

/**
 * Refine clusters by splitting those with mixed topics
 * Prevents issues like "UI design" + "pricing" in the same cluster
 */
function refineClusters(clusteredReviews: ReviewWithEmbedding[]): ReviewWithEmbedding[] {
  const keywordThemes = [
    { name: 'crash', keywords: ['crash', 'freeze', 'bug', 'error', 'broken'] },
    { name: 'slow', keywords: ['slow', 'lag', 'performance', 'loading'] },
    { name: 'price', keywords: ['price', 'cost', 'expensive', 'subscription', 'payment'] },
    { name: 'ads', keywords: ['ad', 'advertisement', 'spam', 'popup'] },
    { name: 'design', keywords: ['ui', 'design', 'interface', 'layout', 'confusing'] },
    { name: 'login', keywords: ['login', 'account', 'password', 'sign', 'authentication'] },
    { name: 'feature', keywords: ['feature', 'missing', 'need', 'add'] },
    { name: 'support', keywords: ['support', 'help', 'customer', 'service'] },
  ];

  // Group reviews by current cluster
  const clusterMap: Record<number, ReviewWithEmbedding[]> = {};
  clusteredReviews.forEach(review => {
    const clusterId = review.clusterId!;
    if (!clusterMap[clusterId]) {
      clusterMap[clusterId] = [];
    }
    clusterMap[clusterId].push(review);
  });

  const refinedReviews: ReviewWithEmbedding[] = [];
  let nextClusterId = 0;

  // Process each cluster
  for (const clusterReviews of Object.values(clusterMap)) {
    // Skip small clusters (no need to refine)
    if (clusterReviews.length < 10) {
      clusterReviews.forEach(review => {
        refinedReviews.push({ ...review, clusterId: nextClusterId });
      });
      nextClusterId++;
      continue;
    }

    // Group reviews within this cluster by keyword theme
    const subclusters: Record<string, ReviewWithEmbedding[]> = {};

    for (const review of clusterReviews) {
      const text = review.text.toLowerCase();
      let bestTheme = 'other';
      let maxMatches = 0;

      // Find dominant keyword theme for this review
      for (const theme of keywordThemes) {
        const matches = theme.keywords.filter(kw => text.includes(kw)).length;
        if (matches > maxMatches) {
          maxMatches = matches;
          bestTheme = theme.name;
        }
      }

      // Group by theme
      if (!subclusters[bestTheme]) {
        subclusters[bestTheme] = [];
      }
      subclusters[bestTheme].push(review);
    }

    // Only split if we have meaningful subclusters (at least 5 reviews each)
    const validSubclusters = Object.entries(subclusters).filter(
      ([_, reviews]) => reviews.length >= 5
    );

    if (validSubclusters.length > 1) {
      // Split into multiple refined clusters
      validSubclusters.forEach(([_, subReviews]) => {
        subReviews.forEach(review => {
          refinedReviews.push({ ...review, clusterId: nextClusterId });
        });
        nextClusterId++;
      });
    } else {
      // Keep as single cluster
      clusterReviews.forEach(review => {
        refinedReviews.push({ ...review, clusterId: nextClusterId });
      });
      nextClusterId++;
    }
  }

  // Log refinement results
  const finalClusterSizes: Record<number, number> = {};
  refinedReviews.forEach(r => {
    finalClusterSizes[r.clusterId!] = (finalClusterSizes[r.clusterId!] || 0) + 1;
  });

  console.log('[SEMANTIC CLUSTERER] After refinement, cluster sizes:', finalClusterSizes);

  return refinedReviews;
}

/**
 * Cluster only negative reviews for insight generation
 */
export async function clusterNegativeReviews(
  reviews: { text: string; score: number; sentiment: 'positive' | 'negative' | 'neutral' }[]
): Promise<ReviewWithEmbedding[]> {
  const negativeReviews = reviews.filter(r => r.sentiment === 'negative');

  if (negativeReviews.length === 0) {
    return [];
  }

  const clusteredReviews = await clusterReviews(negativeReviews);
  
  // Apply cluster refinement to separate mixed topics
  const refinedReviews = refineClusters(clusteredReviews);

  return refinedReviews;
}
