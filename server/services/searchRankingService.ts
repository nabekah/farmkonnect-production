/**
 * Search ranking service for relevance scoring
 * Ranks results based on recency, popularity, and user interaction patterns
 */

interface SearchResult {
  id: number | string;
  name: string;
  category: "animal" | "farm" | "crop";
  createdAt?: Date;
  updatedAt?: Date;
  clickCount?: number;
  searchCount?: number;
  [key: string]: any;
}

interface RankingFactors {
  recencyWeight: number; // 0.2 (20%)
  popularityWeight: number; // 0.3 (30%)
  interactionWeight: number; // 0.3 (30%)
  typeWeight: number; // 0.2 (20%)
}

const DEFAULT_RANKING_FACTORS: RankingFactors = {
  recencyWeight: 0.2,
  popularityWeight: 0.3,
  interactionWeight: 0.3,
  typeWeight: 0.2,
};

export class SearchRankingService {
  /**
   * Calculate relevance score for a search result
   * Score ranges from 0 to 100
   */
  static calculateRelevanceScore(
    result: SearchResult,
    searchQuery: string,
    factors: RankingFactors = DEFAULT_RANKING_FACTORS
  ): number {
    let score = 0;

    // 1. Recency score (0-25 points)
    const recencyScore = this.calculateRecencyScore(result) * 25;
    score += recencyScore * factors.recencyWeight;

    // 2. Popularity score (0-30 points)
    const popularityScore = this.calculatePopularityScore(result) * 30;
    score += popularityScore * factors.popularityWeight;

    // 3. Interaction score (0-30 points)
    const interactionScore = this.calculateInteractionScore(result) * 30;
    score += interactionScore * factors.interactionWeight;

    // 4. Type relevance score (0-20 points)
    const typeScore = this.calculateTypeRelevanceScore(result) * 20;
    score += typeScore * factors.typeWeight;

    // 5. Text matching bonus (0-10 points)
    const textMatchBonus = this.calculateTextMatchBonus(result.name, searchQuery);
    score += textMatchBonus;

    // Normalize to 0-100
    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate recency score (0-1)
   * Newer items score higher
   */
  private static calculateRecencyScore(result: SearchResult): number {
    const now = Date.now();
    const itemDate = result.updatedAt ? new Date(result.updatedAt).getTime() : Date.now();
    const ageInDays = (now - itemDate) / (1000 * 60 * 60 * 24);

    // Items updated in last 7 days get full score
    if (ageInDays <= 7) return 1.0;
    // Items updated in last 30 days get 0.7
    if (ageInDays <= 30) return 0.7;
    // Items updated in last 90 days get 0.4
    if (ageInDays <= 90) return 0.4;
    // Older items get 0.1
    return 0.1;
  }

  /**
   * Calculate popularity score (0-1)
   * Based on search count and click count
   */
  private static calculatePopularityScore(result: SearchResult): number {
    const searchCount = result.searchCount || 0;
    const clickCount = result.clickCount || 0;

    // Normalize: assume max 100 searches and 50 clicks
    const searchScore = Math.min(1, searchCount / 100);
    const clickScore = Math.min(1, clickCount / 50);

    // Combined score with more weight on clicks
    return (searchScore * 0.4 + clickScore * 0.6);
  }

  /**
   * Calculate interaction score (0-1)
   * Based on click-through rate
   */
  private static calculateInteractionScore(result: SearchResult): number {
    const searchCount = result.searchCount || 0;
    const clickCount = result.clickCount || 0;

    if (searchCount === 0) return 0.5; // Default score if no data

    const ctr = clickCount / searchCount;
    // Normalize CTR: assume max 100% CTR
    return Math.min(1, ctr);
  }

  /**
   * Calculate type relevance score (0-1)
   * Prioritize certain types based on context
   */
  private static calculateTypeRelevanceScore(result: SearchResult): number {
    // Animals are most relevant for most searches
    if (result.category === "animal") return 1.0;
    // Farms are secondary
    if (result.category === "farm") return 0.7;
    // Crops are tertiary
    if (result.category === "crop") return 0.5;
    return 0.3;
  }

  /**
   * Calculate text matching bonus (0-10 points)
   * Exact matches and prefix matches score higher
   */
  private static calculateTextMatchBonus(itemName: string, searchQuery: string): number {
    const name = itemName.toLowerCase();
    const query = searchQuery.toLowerCase();

    // Exact match: 10 points
    if (name === query) return 10;
    // Starts with query: 8 points
    if (name.startsWith(query)) return 8;
    // Contains query: 5 points
    if (name.includes(query)) return 5;
    // Word boundary match: 3 points
    if (this.hasWordBoundaryMatch(name, query)) return 3;
    // No match: 0 points
    return 0;
  }

  /**
   * Check if query matches at word boundaries
   */
  private static hasWordBoundaryMatch(text: string, query: string): boolean {
    const words = text.split(/\s+/);
    return words.some((word) => word.toLowerCase().includes(query.toLowerCase()));
  }

  /**
   * Rank multiple search results
   */
  static rankResults(
    results: SearchResult[],
    searchQuery: string,
    factors?: RankingFactors
  ): SearchResult[] {
    const scored = results.map((result) => ({
      ...result,
      relevanceScore: this.calculateRelevanceScore(result, searchQuery, factors),
    }));

    // Sort by relevance score descending
    return scored.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  }

  /**
   * Get ranking factors for different search contexts
   */
  static getContextualFactors(context: "recent" | "popular" | "trending" = "popular"): RankingFactors {
    switch (context) {
      case "recent":
        return {
          recencyWeight: 0.5,
          popularityWeight: 0.2,
          interactionWeight: 0.2,
          typeWeight: 0.1,
        };
      case "trending":
        return {
          recencyWeight: 0.3,
          popularityWeight: 0.4,
          interactionWeight: 0.2,
          typeWeight: 0.1,
        };
      case "popular":
      default:
        return DEFAULT_RANKING_FACTORS;
    }
  }
}
