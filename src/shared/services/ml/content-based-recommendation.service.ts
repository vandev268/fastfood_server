import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { ProductRecommendationType } from 'src/shared/models/shared-recommendation.model'
import { ProductStatus } from 'src/shared/constants/product.constant'

// ========================================
// 🔧 TYPES AND INTERFACES
// ========================================

type ProductSimilarityType = {
  productId: number
  similarity: number
  breakdown: {
    textSimilarity: number
    categorySimilarity: number
  }
}

type SimilarityWeights = {
  textWeight: number // Weight cho text similarity (name + shortDesc)
  categoryWeight: number // Weight cho category similarity
}

type CachedSimilarity = {
  similarities: ProductSimilarityType[]
  timestamp: number
}

type CachedCandidates = {
  products: any[]
  timestamp: number
}

type CachedCategories = {
  categoriesMap: Map<number, { id: number; name: string }[]>
  timestamp: number
}

@Injectable()
export class ContentBasedRecommendationService {
  constructor(private readonly prismaService: PrismaService) {}

  // ========================================
  // 🚀 PERFORMANCE OPTIMIZATION - CACHING SYSTEM
  // ========================================

  // Multi-level cache với different TTL
  private similarityCache = new Map<string, CachedSimilarity>()
  private candidateCache = new Map<string, CachedCandidates>()
  private categoriesCache = new Map<string, CachedCategories>()

  // Cache TTLs for optimal performance (30 minutes to reduce client lag)
  private readonly SIMILARITY_CACHE_TTL = 45 * 60 * 1000 // 30 minutes
  private readonly CANDIDATE_CACHE_TTL = 45 * 60 * 1000 // 30 minutes
  private readonly CATEGORIES_CACHE_TTL = 45 * 60 * 1000 // 30 minutes
  private readonly MAX_CACHE_SIZE = 1000 // Prevent memory leak

  // ========================================
  // 🏗️ UTILITY FUNCTIONS
  // ========================================

  /**
   * 🚀 OPTIMIZATION 1: Cache Management
   */
  private cleanupCache(): void {
    const now = Date.now()

    // Cleanup similarity cache
    for (const [key, cached] of this.similarityCache.entries()) {
      if (now - cached.timestamp > this.SIMILARITY_CACHE_TTL) {
        this.similarityCache.delete(key)
      }
    }

    // Cleanup candidate cache
    for (const [key, cached] of this.candidateCache.entries()) {
      if (now - cached.timestamp > this.CANDIDATE_CACHE_TTL) {
        this.candidateCache.delete(key)
      }
    }

    // Cleanup categories cache
    for (const [key, cached] of this.categoriesCache.entries()) {
      if (now - cached.timestamp > this.CATEGORIES_CACHE_TTL) {
        this.categoriesCache.delete(key)
      }
    }
  }

  private evictOldestCacheEntry<T>(cache: Map<string, T>, maxSize: number): void {
    if (cache.size >= maxSize) {
      const oldestKey = cache.keys().next().value
      cache.delete(oldestKey)
    }
  }

  /**
   * 🚀 OPTIMIZATION 2: Batch Category Loading (N+1 → 1 query)
   */
  private async getCategoriesBatch(productIds: number[]): Promise<Map<number, { id: number; name: string }[]>> {
    const cacheKey = `categories_${productIds.sort().join('_')}`
    const cached = this.categoriesCache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < this.CATEGORIES_CACHE_TTL) {
      return cached.categoriesMap
    }

    const productCategories = await this.prismaService.category.findMany({
      where: {
        products: { some: { id: { in: productIds } } },
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        products: {
          select: { id: true },
          where: { id: { in: productIds } }
        }
      }
    })

    // Build lookup map: productId → categories[]
    const categoriesMap = new Map<number, { id: number; name: string }[]>()

    productCategories.forEach((category) => {
      category.products.forEach((product) => {
        if (!categoriesMap.has(product.id)) {
          categoriesMap.set(product.id, [])
        }
        categoriesMap.get(product.id)!.push({
          id: category.id,
          name: category.name
        })
      })
    })

    // Cache the result with LRU eviction
    this.evictOldestCacheEntry(this.categoriesCache, this.MAX_CACHE_SIZE)
    this.categoriesCache.set(cacheKey, {
      categoriesMap,
      timestamp: Date.now()
    })

    return categoriesMap
  }

  /**
   * 🚀 OPTIMIZATION 3: Smart Candidate Pool Limiting
   */
  private async getCandidateProducts(referenceProductId: number, maxCandidates: number = 800): Promise<any[]> {
    const cacheKey = `candidates_${referenceProductId}_${maxCandidates}`
    const cached = this.candidateCache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < this.CANDIDATE_CACHE_TTL) {
      return cached.products
    }

    // Get reference product categories for smart filtering
    const referenceProduct = await this.prismaService.product.findUnique({
      where: { id: referenceProductId },
      select: { categories: { select: { id: true } } }
    })

    const refCategoryIds = referenceProduct?.categories.map((c) => c.id) || []

    // Tier 1: Same categories (70% - highest priority)
    const sameCategoryProducts = await this.prismaService.product.findMany({
      where: {
        status: ProductStatus.Available,
        deletedAt: null,
        id: { not: referenceProductId },
        categories: { some: { id: { in: refCategoryIds } } }
      },
      select: {
        id: true,
        name: true,
        shortDescription: true,
        categories: { select: { id: true } }
      },
      take: Math.floor(maxCandidates * 0.7),
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }]
    })

    // Tier 2: Different categories (30% - for diversity)
    const remainingSlots = maxCandidates - sameCategoryProducts.length
    const usedIds = sameCategoryProducts.map((p) => p.id)

    const otherProducts =
      remainingSlots > 0
        ? await this.prismaService.product.findMany({
            where: {
              status: ProductStatus.Available,
              deletedAt: null,
              id: {
                not: referenceProductId,
                notIn: usedIds
              }
            },
            select: {
              id: true,
              name: true,
              shortDescription: true,
              categories: { select: { id: true } }
            },
            take: remainingSlots,
            orderBy: [{ createdAt: 'desc' }, { id: 'asc' }]
          })
        : []

    const candidateProducts = [...sameCategoryProducts, ...otherProducts]

    // Cache the result with LRU eviction
    this.evictOldestCacheEntry(this.candidateCache, this.MAX_CACHE_SIZE)
    this.candidateCache.set(cacheKey, {
      products: candidateProducts,
      timestamp: Date.now()
    })

    return candidateProducts
  }

  /**
   * Clean HTML tags và normalize Vietnamese text
   */
  private cleanAndNormalizeText(text: string): string {
    if (!text) return ''

    // Remove HTML tags
    const withoutHtml = text.replace(/<[^>]*>/g, ' ')

    // Normalize Vietnamese accents
    const normalized = withoutHtml
      .toLowerCase()
      .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
      .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
      .replace(/[ìíịỉĩ]/g, 'i')
      .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
      .replace(/[ùúụủũưừứựửữ]/g, 'u')
      .replace(/[ỳýỵỷỹ]/g, 'y')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    return normalized
  }

  /**
   * Calculate TF-IDF vectors and cosine similarity using full corpus
   */
  private calculateTextSimilarity(text1: string, text2: string, allProductTexts: string[]): number {
    const cleanText1 = this.cleanAndNormalizeText(text1)
    const cleanText2 = this.cleanAndNormalizeText(text2)

    if (!cleanText1 || !cleanText2) return 0

    const words1 = cleanText1.split(' ')
    const words2 = cleanText2.split(' ')

    // Create vocabulary from all corpus
    const allWords = new Set<string>()
    allProductTexts.forEach((text) => {
      const cleanText = this.cleanAndNormalizeText(text)
      cleanText.split(' ').forEach((word) => allWords.add(word))
    })

    // Calculate TF-IDF for each document
    const tfidf1 = this.calculateTFIDF(words1, allWords, allProductTexts)
    const tfidf2 = this.calculateTFIDF(words2, allWords, allProductTexts)

    // Calculate cosine similarity
    return this.cosineSimilarity(tfidf1, tfidf2)
  }

  /**
   * Calculate TF-IDF vector for a document
   */
  private calculateTFIDF(words: string[], vocab: Set<string>, corpus: string[]): number[] {
    const tfidf: number[] = []
    const wordCount = words.length
    const corpusSize = corpus.length

    vocab.forEach((word) => {
      // Calculate TF (Term Frequency)
      const termCount = words.filter((w) => w === word).length
      const tf = termCount / wordCount

      // Calculate IDF (Inverse Document Frequency)
      const documentsWithTerm = corpus.filter((doc) => {
        const cleanDoc = this.cleanAndNormalizeText(doc)
        return cleanDoc.includes(word)
      }).length

      const idf = documentsWithTerm > 0 ? Math.log(corpusSize / documentsWithTerm) : 0

      // TF-IDF = TF × IDF
      tfidf.push(tf * idf)
    })

    return tfidf
  }

  /**
   * Legacy TF calculation (kept for backward compatibility)
   */
  // private calculateTF(words: string[], vocab: Set<string>): number[] {
  //   const tf: number[] = []
  //   const wordCount = words.length

  //   vocab.forEach((word) => {
  //     const count = words.filter((w) => w === word).length
  //     tf.push(count / wordCount)
  //   })

  //   return tf
  // }

  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    let dotProduct = 0
    let norm1 = 0
    let norm2 = 0

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i]
      norm1 += vec1[i] * vec1[i]
      norm2 += vec2[i] * vec2[i]
    }

    if (norm1 === 0 || norm2 === 0) return 0

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
  }

  /**
   * Calculate Jaccard similarity cho categories
   */
  private calculateJaccardSimilarity<T>(set1: T[], set2: T[]): number {
    const s1 = new Set(set1)
    const s2 = new Set(set2)

    const intersection = new Set([...s1].filter((x) => s2.has(x)))
    const union = new Set([...s1, ...s2])

    return union.size === 0 ? 0 : intersection.size / union.size
  }

  // ========================================
  // 📚 CORE CONTENT-BASED FILTERING
  // ========================================

  /**
   * Tự động tìm reference product dựa vào user behavior hoặc popularity
   */
  private async findReferenceProduct(userId?: number): Promise<number | null> {
    // Nếu có userId, tìm sản phẩm user quan tâm nhất với weighted scoring
    if (userId) {
      const userMostInteracted = await this.prismaService.$queryRaw<
        Array<{ productId: number; productName: string; score: number }>
      >`
        SELECT 
          ubl."productId",
          p.name as "productName",
          SUM(
            CASE 
              WHEN ubl.action = 'order' THEN ubl.count * 3
              WHEN ubl.action = 'review' THEN 
                CASE 
                  WHEN (ubl.data->>'rating')::float >= 5.0 THEN ubl.count * 4   -- 5 sao: Rất thích = +4 điểm
                  WHEN (ubl.data->>'rating')::float >= 4.0 THEN ubl.count * 3   -- 4 sao: Thích = +3 điểm
                  WHEN (ubl.data->>'rating')::float >= 3.0 THEN ubl.count * 1   -- 3 sao: OK = +1 điểm
                  WHEN (ubl.data->>'rating')::float >= 2.0 THEN ubl.count * (-2) -- 2 sao: Không thích = -2 điểm
                  WHEN (ubl.data->>'rating')::float >= 1.0 THEN ubl.count * (-3) -- 1 sao: Rất không thích = -3 điểm
                  ELSE ubl.count * (-5) -- 0 sao: Cực kỳ ghét = -5 điểm
                END
              WHEN ubl.action = 'cart' THEN ubl.count * 2  
              WHEN ubl.action = 'view' THEN ubl.count * 1
              ELSE ubl.count * 0.5
            END
          ) as "score"
        FROM "UserBehaviorLog" ubl
        JOIN "Product" p ON p.id = ubl."productId"
        WHERE ubl."userId" = ${userId}
          AND ubl.action IN ('view', 'cart', 'order', 'review')
          AND p."deletedAt" IS NULL
        GROUP BY ubl."productId", p.name
        HAVING SUM(
          CASE 
            WHEN ubl.action = 'order' THEN ubl.count * 3
            WHEN ubl.action = 'review' THEN 
              CASE 
                WHEN (ubl.data->>'rating')::float >= 5.0 THEN ubl.count * 4
                WHEN (ubl.data->>'rating')::float >= 4.0 THEN ubl.count * 3
                WHEN (ubl.data->>'rating')::float >= 3.0 THEN ubl.count * 1
                WHEN (ubl.data->>'rating')::float >= 2.0 THEN ubl.count * (-2)
                WHEN (ubl.data->>'rating')::float >= 1.0 THEN ubl.count * (-3)
                ELSE ubl.count * (-5)
              END
            WHEN ubl.action = 'cart' THEN ubl.count * 2  
            WHEN ubl.action = 'view' THEN ubl.count * 1
            ELSE ubl.count * 0.5
          END
        ) > 0
        ORDER BY "score" DESC
        LIMIT 5
      `

      if (userMostInteracted.length > 0) {
        console.log(userMostInteracted)
        return userMostInteracted[0].productId
      }
    }

    // Nếu không có user hoặc user chưa có behavior, lấy sản phẩm phổ biến nhất với weighted scoring
    const mostPopular = await this.prismaService.$queryRaw<
      Array<{ productId: number; productName: string; score: number }>
    >`
      SELECT 
        ubl."productId",
        p.name as "productName",
        SUM(
          CASE 
            WHEN ubl.action = 'order' THEN ubl.count * 3
            WHEN ubl.action = 'review' THEN 
              CASE 
                WHEN (ubl.data->>'rating')::float >= 5.0 THEN ubl.count * 4   -- 5 sao: Rất thích = +4 điểm
                WHEN (ubl.data->>'rating')::float >= 4.0 THEN ubl.count * 3   -- 4 sao: Thích = +3 điểm
                WHEN (ubl.data->>'rating')::float >= 3.0 THEN ubl.count * 1   -- 3 sao: OK = +1 điểm
                WHEN (ubl.data->>'rating')::float >= 2.0 THEN ubl.count * (-2) -- 2 sao: Không thích = -2 điểm
                WHEN (ubl.data->>'rating')::float >= 1.0 THEN ubl.count * (-3) -- 1 sao: Rất không thích = -3 điểm
                ELSE ubl.count * (-5) -- 0 sao: Cực kỳ ghét = -5 điểm
              END
            WHEN ubl.action = 'cart' THEN ubl.count * 2  
            WHEN ubl.action = 'view' THEN ubl.count * 1
            ELSE ubl.count * 0.5
          END
        ) as "score"
      FROM "UserBehaviorLog" ubl
      JOIN "Product" p ON p.id = ubl."productId"
      WHERE ubl.action IN ('view', 'cart', 'order', 'review')
        AND p."deletedAt" IS NULL
      GROUP BY ubl."productId", p.name
      HAVING SUM(
        CASE 
          WHEN ubl.action = 'order' THEN ubl.count * 3
          WHEN ubl.action = 'review' THEN 
            CASE 
              WHEN (ubl.data->>'rating')::float >= 5.0 THEN ubl.count * 4
              WHEN (ubl.data->>'rating')::float >= 4.0 THEN ubl.count * 3
              WHEN (ubl.data->>'rating')::float >= 3.0 THEN ubl.count * 1
              WHEN (ubl.data->>'rating')::float >= 2.0 THEN ubl.count * (-2)
              WHEN (ubl.data->>'rating')::float >= 1.0 THEN ubl.count * (-3)
              ELSE ubl.count * (-5)
            END
          WHEN ubl.action = 'cart' THEN ubl.count * 2  
          WHEN ubl.action = 'view' THEN ubl.count * 1
          ELSE ubl.count * 0.5
        END
      ) > 0
      ORDER BY "score" DESC
      LIMIT 5
    `

    if (mostPopular.length > 0) {
      console.log(mostPopular)
      return mostPopular[0].productId
    }

    // Fallback: lấy product đầu tiên trong database
    const firstProduct = await this.prismaService.product.findFirst({
      where: { status: 'Available', deletedAt: null },
      select: { id: true }
    })

    return firstProduct ? firstProduct.id : null
  }

  /**
   * Content-Based Filtering - tìm sản phẩm tương tự với TF-IDF (OPTIMIZED)
   */
  async calculateContentSimilarity(
    referenceProductId: number,
    limit: number = 10,
    weights: SimilarityWeights = {
      textWeight: 0.6,
      categoryWeight: 0.4
    }
  ): Promise<ProductSimilarityType[]> {
    // 🚀 OPTIMIZATION: Check similarity cache first
    const cacheKey = `sim_${referenceProductId}_${limit}_${weights.textWeight}_${weights.categoryWeight}`
    const cached = this.similarityCache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < this.SIMILARITY_CACHE_TTL) {
      return cached.similarities
    }

    // Lấy reference product
    const referenceProduct = await this.prismaService.product.findUnique({
      where: { id: referenceProductId },
      select: {
        id: true,
        name: true,
        shortDescription: true,
        categories: { select: { id: true } }
      }
    })

    if (!referenceProduct) {
      throw new Error(`Product với ID ${referenceProductId} không tồn tại`)
    }

    // 🚀 OPTIMIZATION: Use smart candidate pool instead of loading all products
    const products = await this.getCandidateProducts(referenceProductId, 800)

    // Build corpus cho TF-IDF (bao gồm cả reference product)
    const allProductTexts = [
      `${referenceProduct.name} ${referenceProduct.shortDescription || ''}`,
      ...products.map((p) => `${p.name} ${p.shortDescription || ''}`)
    ]

    // Tính similarity cho từng product
    const similarities: ProductSimilarityType[] = []

    for (const product of products) {
      // 1. TF-IDF Text similarity (name + shortDescription)
      const refText = `${referenceProduct.name} ${referenceProduct.shortDescription || ''}`
      const prodText = `${product.name} ${product.shortDescription || ''}`
      const textSimilarity = this.calculateTextSimilarity(refText, prodText, allProductTexts)

      // 2. Category similarity (Jaccard)
      const refCategoryIds = referenceProduct.categories?.map((c) => c.id) || []
      const prodCategoryIds = product.categories?.map((c) => c.id) || []
      const categorySimilarity = this.calculateJaccardSimilarity(refCategoryIds, prodCategoryIds)

      // 3. Final weighted similarity (TF-IDF text + category)
      const finalSimilarity = textSimilarity * weights.textWeight + categorySimilarity * weights.categoryWeight

      similarities.push({
        productId: product.id,
        similarity: finalSimilarity,
        breakdown: {
          textSimilarity: Number(textSimilarity.toFixed(4)),
          categorySimilarity: Number(categorySimilarity.toFixed(4))
        }
      })
    }

    // Sort theo similarity và get top results
    const sortedSimilarities = similarities.sort((a, b) => b.similarity - a.similarity).slice(0, limit)

    // 🚀 OPTIMIZATION: Cache the result with LRU eviction
    this.evictOldestCacheEntry(this.similarityCache, this.MAX_CACHE_SIZE)
    this.similarityCache.set(cacheKey, {
      similarities: sortedSimilarities,
      timestamp: Date.now()
    })

    return sortedSimilarities
  }

  // ========================================
  // 🎯 MAIN PUBLIC METHOD
  // ========================================

  /**
   * Main method cho Content-Based Recommendations (FULLY OPTIMIZED)
   */
  async getContentBasedRecommendations(
    userId?: number,
    limit: number = 10,
    customReferenceId?: number
  ): Promise<ProductRecommendationType[]> {
    try {
      // Periodic cache cleanup
      this.cleanupCache()

      // 1. Tìm reference product
      const referenceProductId = customReferenceId || (await this.findReferenceProduct(userId))

      if (!referenceProductId) {
        return []
      }

      // 2. Tính content similarity (with caching and candidate limiting)
      const similarities = await this.calculateContentSimilarity(referenceProductId, limit * 2)

      if (similarities.length === 0) {
        return []
      }

      // 3. Get full product data
      const productIds = similarities.map((s) => s.productId)
      const products = await this.prismaService.product.findMany({
        where: {
          id: { in: productIds },
          status: 'Available',
          deletedAt: null
        },
        select: {
          id: true,
          name: true,
          basePrice: true,
          images: true,
          status: true,
          variantsConfig: true,
          type: true,
          shortDescription: true,
          deletedAt: true,
          reviews: {
            select: { rating: true }
          }
        }
      })

      // 4. 🚀 OPTIMIZATION: Batch category loading (N+1 → 1 query)
      const categoriesMap = await this.getCategoriesBatch(productIds)

      // 5. Map products với similarity scores
      const productMap = new Map(products.map((p) => [p.id, p]))

      const recommendations = similarities
        .map((similarity) => {
          const product = productMap.get(similarity.productId)
          if (!product) return null

          // Tính rating statistics
          const ratings = product.reviews.map((r) => r.rating)
          const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null

          // Get categories from batch-loaded map
          const categories = categoriesMap.get(product.id) || []

          return {
            id: product.id,
            name: product.name,
            basePrice: product.basePrice,
            images: product.images,
            status: product.status,
            variantsConfig: product.variantsConfig,
            type: product.type,
            shortDescription: product.shortDescription,
            deletedAt: product.deletedAt,
            score: similarity.similarity,
            reason: `Similar to reference product (${referenceProductId})`,
            rating: {
              avg: avgRating ? Number(avgRating.toFixed(2)) : null,
              quantity: ratings.length
            },
            categories,
            // Additional debugging info
            similarityBreakdown: similarity.breakdown
          }
        })
        .filter(Boolean) as ProductRecommendationType[]

      return recommendations.slice(0, limit)
    } catch (error) {
      console.error('❌ [ERROR] Content-based recommendation failed:', error)
      return []
    }
  }

  /**
   * Get similarity analysis cho debugging/research
   */
  async getSimilarityAnalysis(referenceProductId: number): Promise<any> {
    const similarities = await this.calculateContentSimilarity(referenceProductId, 20)

    const productNames = await this.prismaService.product.findMany({
      where: { id: { in: similarities.map((s) => s.productId) } },
      select: { id: true, name: true }
    })

    const nameMap = new Map(productNames.map((p) => [p.id, p.name]))

    return similarities.map((s) => ({
      productId: s.productId,
      productName: nameMap.get(s.productId),
      totalSimilarity: Number(s.similarity.toFixed(4)),
      breakdown: s.breakdown
    }))
  }

  /**
   * Get cache statistics for monitoring and debugging
   */
  getCacheStats() {
    return {
      caches: {
        similarity: {
          size: this.similarityCache.size,
          maxSize: this.MAX_CACHE_SIZE,
          ttl_minutes: this.SIMILARITY_CACHE_TTL / (60 * 1000)
        },
        candidates: {
          size: this.candidateCache.size,
          maxSize: this.MAX_CACHE_SIZE,
          ttl_minutes: this.CANDIDATE_CACHE_TTL / (60 * 1000)
        },
        categories: {
          size: this.categoriesCache.size,
          maxSize: this.MAX_CACHE_SIZE,
          ttl_minutes: this.CATEGORIES_CACHE_TTL / (60 * 1000)
        }
      },
      totalMemoryUsage: `~${(this.similarityCache.size + this.candidateCache.size + this.categoriesCache.size) * 2}KB`
    }
  }

  /**
   * Manual cache clear for testing/debugging
   */
  clearCache() {
    this.similarityCache.clear()
    this.candidateCache.clear()
    this.categoriesCache.clear()
  }
}
