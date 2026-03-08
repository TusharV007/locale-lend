/**
 * Trust Engine - Calculates user trust scores for the Local Share platform
 * 
 * The trust score is a weighted average that considers:
 * - Peer Reviews (70% weight): Average rating from other users
 * - Successful Returns (30% weight): Ratio of successful lending transactions
 * 
 * This creates a balanced score that values both community feedback
 * and reliable behavior in actual lending transactions.
 */

// Weight constants for trust calculation
const REVIEW_WEIGHT = 0.7;  // 70% weight for peer reviews
const RETURN_WEIGHT = 0.3;  // 30% weight for successful returns

// Minimum reviews needed for full confidence in the score
const MIN_REVIEWS_FOR_CONFIDENCE = 5;

// Base score for new users with no history
const NEW_USER_BASE_SCORE = 3.0;

interface TrustCalculationInput {
  // Average rating from peer reviews (1-5 scale)
  averageReviewRating: number;
  // Total number of reviews received
  totalReviews: number;
  // Number of items successfully returned on time
  successfulReturns: number;
  // Total number of borrowing transactions
  totalBorrowings: number;
  // Number of items successfully lent out
  successfulLends: number;
  // Total lending transactions
  totalLendings: number;
  // Whether user is verified (email, phone, ID)
  isVerified: boolean;
  // Account age in days
  accountAgeDays: number;
}

interface TrustScoreResult {
  score: number;           // Final trust score (0-5)
  level: 'New' | 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  confidence: 'Low' | 'Medium' | 'High';
  breakdown: {
    reviewComponent: number;
    returnComponent: number;
    verificationBonus: number;
    tenureBonus: number;
  };
}

/**
 * Calculates a user's trust score using a weighted average algorithm
 * 
 * Formula: TrustScore = (ReviewScore × 0.7) + (ReturnScore × 0.3) + Bonuses
 * 
 * @param input - User metrics for trust calculation
 * @returns TrustScoreResult with score, level, and breakdown
 */
export function calculateTrustScore(input: TrustCalculationInput): TrustScoreResult {
  const {
    averageReviewRating,
    totalReviews,
    successfulReturns,
    totalBorrowings,
    successfulLends,
    totalLendings,
    isVerified,
    accountAgeDays,
  } = input;

  // Calculate review component (normalized to 0-5 scale)
  // Apply confidence adjustment based on number of reviews
  let reviewComponent: number;
  if (totalReviews === 0) {
    // No reviews yet - use base score
    reviewComponent = NEW_USER_BASE_SCORE;
  } else {
    // Confidence factor increases as reviews approach MIN_REVIEWS_FOR_CONFIDENCE
    const confidenceFactor = Math.min(totalReviews / MIN_REVIEWS_FOR_CONFIDENCE, 1);
    // Blend between base score and actual rating based on confidence
    reviewComponent = (NEW_USER_BASE_SCORE * (1 - confidenceFactor)) +
      (averageReviewRating * confidenceFactor);
  }

  // Calculate return rate component (normalized to 0-5 scale)
  // Considers both borrowing and lending history
  let returnComponent: number;
  const totalTransactions = totalBorrowings + totalLendings;
  const successfulTransactions = successfulReturns + successfulLends;

  if (totalTransactions === 0) {
    // No transaction history - use neutral score
    returnComponent = NEW_USER_BASE_SCORE;
  } else {
    // Calculate success rate and convert to 0-5 scale
    const successRate = successfulTransactions / totalTransactions;
    returnComponent = successRate * 5;
  }

  // Apply weights to calculate base score
  let score = (reviewComponent * REVIEW_WEIGHT) + (returnComponent * RETURN_WEIGHT);

  // Verification bonus: +0.2 for verified users
  const verificationBonus = isVerified ? 0.2 : 0;

  // Tenure bonus: Up to +0.3 for accounts over 1 year old
  // Linear scaling: 0.3 × (days / 365), capped at 0.3
  const tenureBonus = Math.min(accountAgeDays / 365, 1) * 0.3;

  // Add bonuses to final score
  score = Math.min(score + verificationBonus + tenureBonus, 5);
  score = Math.max(score, 0); // Ensure non-negative

  // Determine trust level based on final score
  let level: TrustScoreResult['level'];
  if (score >= 4.5) level = 'Platinum';
  else if (score >= 4.0) level = 'Gold';
  else if (score >= 3.5) level = 'Silver';
  else if (score >= 2.5) level = 'Bronze';
  else level = 'New';

  // Determine confidence level based on data availability
  let confidence: TrustScoreResult['confidence'];
  if (totalReviews >= MIN_REVIEWS_FOR_CONFIDENCE && totalTransactions >= 5) {
    confidence = 'High';
  } else if (totalReviews >= 2 || totalTransactions >= 2) {
    confidence = 'Medium';
  } else {
    confidence = 'Low';
  }

  return {
    score: Math.round(score * 10) / 10, // Round to 1 decimal
    level,
    confidence,
    breakdown: {
      reviewComponent: Math.round(reviewComponent * 10) / 10,
      returnComponent: Math.round(returnComponent * 10) / 10,
      verificationBonus,
      tenureBonus: Math.round(tenureBonus * 100) / 100,
    },
  };
}

/**
 * Get display color class for trust score
 */
export function getTrustColorClass(score: number): string {
  if (score >= 4.0) return 'trust-high';
  if (score >= 2.5) return 'trust-medium';
  return 'text-muted-foreground';
}

/**
 * Format trust score for display
 */
export function formatTrustScore(score: number): string {
  return score.toFixed(1);
}
