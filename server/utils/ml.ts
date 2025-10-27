/**
 * Machine Learning utilities for semantic clustering
 * Includes cosine similarity and k-means clustering
 */

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Calculate Euclidean distance between two vectors
 */
function euclideanDistance(vecA: number[], vecB: number[]): number {
  let sum = 0;
  for (let i = 0; i < vecA.length; i++) {
    sum += Math.pow(vecA[i] - vecB[i], 2);
  }
  return Math.sqrt(sum);
}

/**
 * K-means clustering algorithm
 */
export interface KMeansResult {
  assignments: number[]; // cluster ID for each data point
  centroids: number[][]; // final centroid positions
  iterations: number;
}

export function kmeans(
  data: number[][],
  k: number,
  maxIterations: number = 100,
  tolerance: number = 1e-4
): KMeansResult {
  if (data.length === 0) {
    return { assignments: [], centroids: [], iterations: 0 };
  }

  if (k > data.length) {
    k = data.length;
  }

  const n = data.length;
  const dimensions = data[0].length;

  // Initialize centroids using k-means++ for better initialization
  const centroids: number[][] = [];
  const usedIndices = new Set<number>();

  // Pick first centroid randomly
  const firstIdx = Math.floor(Math.random() * n);
  centroids.push([...data[firstIdx]]);
  usedIndices.add(firstIdx);

  // Pick remaining centroids using k-means++
  for (let i = 1; i < k; i++) {
    const distances: number[] = new Array(n);
    let sumDistances = 0;

    for (let j = 0; j < n; j++) {
      if (usedIndices.has(j)) {
        distances[j] = 0;
        continue;
      }

      // Find minimum distance to existing centroids
      let minDist = Infinity;
      for (const centroid of centroids) {
        const dist = euclideanDistance(data[j], centroid);
        minDist = Math.min(minDist, dist);
      }
      distances[j] = minDist * minDist;
      sumDistances += distances[j];
    }

    // Pick next centroid with probability proportional to distance squared
    let random = Math.random() * sumDistances;
    let nextIdx = 0;
    for (let j = 0; j < n; j++) {
      random -= distances[j];
      if (random <= 0) {
        nextIdx = j;
        break;
      }
    }

    centroids.push([...data[nextIdx]]);
    usedIndices.add(nextIdx);
  }

  let assignments = new Array(n).fill(0);
  let iteration = 0;

  for (; iteration < maxIterations; iteration++) {
    let changed = false;

    // Assignment step: assign each point to nearest centroid
    for (let i = 0; i < n; i++) {
      let minDist = Infinity;
      let bestCluster = 0;

      for (let j = 0; j < k; j++) {
        const dist = euclideanDistance(data[i], centroids[j]);
        if (dist < minDist) {
          minDist = dist;
          bestCluster = j;
        }
      }

      if (assignments[i] !== bestCluster) {
        changed = true;
        assignments[i] = bestCluster;
      }
    }

    if (!changed) {
      break;
    }

    // Update step: recalculate centroids
    const newCentroids: number[][] = Array(k)
      .fill(null)
      .map(() => Array(dimensions).fill(0));
    const counts = Array(k).fill(0);

    for (let i = 0; i < n; i++) {
      const cluster = assignments[i];
      counts[cluster]++;
      for (let d = 0; d < dimensions; d++) {
        newCentroids[cluster][d] += data[i][d];
      }
    }

    // Calculate new centroids
    let maxShift = 0;
    for (let j = 0; j < k; j++) {
      if (counts[j] === 0) {
        // Empty cluster - reinitialize with random point
        const randomIdx = Math.floor(Math.random() * n);
        newCentroids[j] = [...data[randomIdx]];
      } else {
        for (let d = 0; d < dimensions; d++) {
          newCentroids[j][d] /= counts[j];
        }
      }

      // Calculate shift
      const shift = euclideanDistance(centroids[j], newCentroids[j]);
      maxShift = Math.max(maxShift, shift);
    }

    centroids.splice(0, centroids.length, ...newCentroids);

    // Check convergence
    if (maxShift < tolerance) {
      break;
    }
  }

  return {
    assignments,
    centroids,
    iterations: iteration + 1,
  };
}

/**
 * Find the most representative item in a cluster based on similarity to a target vector
 */
export function findMostSimilar(
  targetVector: number[],
  candidates: { text: string; vector: number[] }[]
): string {
  if (candidates.length === 0) {
    return '';
  }

  let bestScore = -1;
  let bestText = candidates[0].text;

  for (const candidate of candidates) {
    const score = cosineSimilarity(targetVector, candidate.vector);
    if (score > bestScore) {
      bestScore = score;
      bestText = candidate.text;
    }
  }

  return bestText;
}
