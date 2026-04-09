import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cache } from 'cache-manager';
import { ILlmAdapter, LLM_ADAPTER } from '@ai-platform/ai-core';
import { FeedbackCache } from '../database/entities/feedback-cache.entity';

@Injectable()
export class CachedFeedbackService {
  private readonly logger = new Logger(CachedFeedbackService.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    @InjectRepository(FeedbackCache)
    private readonly feedbackCacheRepo: Repository<FeedbackCache>,
    @Inject(LLM_ADAPTER) private readonly llm: ILlmAdapter,
  ) {}

  async getPronunciationFeedback(
    word: string,
    score: number,
    phonemeDetail: Record<string, unknown> | null,
  ): Promise<string> {
    const bucket = this.scoreToBucket(score);
    const weakPhoneme = this.findWeakestPhoneme(phonemeDetail);
    const cacheKey = `pron:${word}:${bucket}:${weakPhoneme ?? 'general'}`;

    // Tier 1: In-memory / Redis cache (1-5ms)
    const cached = await this.cache.get<string>(cacheKey);
    if (cached) {
      this.trackHit(cacheKey);
      return cached;
    }

    // Tier 2: DB persistent cache (5-20ms)
    const dbCached = await this.feedbackCacheRepo.findOneBy({ cacheKey });
    if (dbCached) {
      await this.cache.set(cacheKey, dbCached.feedbackText, 86400);
      this.trackHit(cacheKey);
      return dbCached.feedbackText;
    }

    // Tier 3: LLM generate (200-600ms) + write-back
    return this.generateAndPersist(
      cacheKey,
      'pronunciation',
      word,
      bucket,
      weakPhoneme,
      score,
    );
  }

  async getQuizFeedback(
    correctAnswer: string,
    isCorrect: boolean,
  ): Promise<string> {
    const resultKey = isCorrect ? 'correct' : 'wrong';
    const cacheKey = `quiz:${correctAnswer}:${resultKey}`;

    // Tier 1: Cache
    const cached = await this.cache.get<string>(cacheKey);
    if (cached) {
      this.trackHit(cacheKey);
      return cached;
    }

    // Tier 2: DB
    const dbCached = await this.feedbackCacheRepo.findOneBy({ cacheKey });
    if (dbCached) {
      await this.cache.set(cacheKey, dbCached.feedbackText, 86400);
      this.trackHit(cacheKey);
      return dbCached.feedbackText;
    }

    // Tier 3: LLM
    const prompt =
      `Trẻ 6-10 tuổi trả lời ${isCorrect ? 'đúng' : 'sai'}, ` +
      `đáp án đúng là '${correctAnswer}'. ` +
      `${isCorrect ? 'Khen' : 'Động viên'} ngắn gọn 1 câu.`;
    const feedback = await this.llm.generate(prompt);
    await this.persist(cacheKey, 'quiz', correctAnswer, null, null, feedback);
    return feedback;
  }

  async generateAndPersist(
    cacheKey: string,
    cacheType: string,
    word: string,
    bucket: string,
    weakPhoneme: string | null,
    score: number,
  ): Promise<string> {
    const phonemeHint = weakPhoneme
      ? `Âm yếu nhất: ${weakPhoneme}.`
      : '';
    const prompt =
      `Trẻ 6-10 tuổi đọc từ '${word}', điểm phát âm ~${score}/100.\n` +
      `${phonemeHint}\n` +
      `Feedback 1-2 câu, vui vẻ, phù hợp trẻ em.`;
    const feedback = await this.llm.generate(prompt);
    await this.persist(cacheKey, cacheType, word, bucket, weakPhoneme, feedback);
    return feedback;
  }

  async persist(
    cacheKey: string,
    cacheType: string,
    word: string,
    bucket: string | null,
    weakPhoneme: string | null,
    feedback: string,
  ): Promise<void> {
    // Write to cache
    await this.cache.set(cacheKey, feedback, 86400);

    // Write to DB (persistent)
    try {
      const existing = await this.feedbackCacheRepo.findOneBy({ cacheKey });
      if (existing) {
        existing.feedbackText = feedback;
        await this.feedbackCacheRepo.save(existing);
      } else {
        await this.feedbackCacheRepo.save(
          this.feedbackCacheRepo.create({
            cacheKey,
            cacheType,
            word,
            scoreBucket: bucket,
            weakPhoneme,
            feedbackText: feedback,
            source: 'llm',
          }),
        );
      }
    } catch (err) {
      this.logger.warn(`Failed to persist feedback cache: ${cacheKey}`, err);
    }
  }

  trackHit(cacheKey: string): void {
    // Fire-and-forget: update hit count asynchronously
    this.feedbackCacheRepo
      .update({ cacheKey }, { hitCount: () => 'hit_count + 1', lastHitAt: new Date() })
      .catch((err) =>
        this.logger.warn(`Failed to track hit for ${cacheKey}`, err),
      );
  }

  scoreToBucket(score: number): string {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'medium';
    return 'low';
  }

  findWeakestPhoneme(
    detail: Record<string, unknown> | null,
  ): string | null {
    if (!detail) return null;
    const phonemes = detail['phonemes'] as
      | Array<{ phoneme: string; score: number }>
      | undefined;
    if (!phonemes || phonemes.length === 0) return null;

    const weakest = phonemes.reduce((min, p) =>
      p.score < min.score ? p : min,
    );
    return weakest.score < 70 ? weakest.phoneme : null;
  }
}
