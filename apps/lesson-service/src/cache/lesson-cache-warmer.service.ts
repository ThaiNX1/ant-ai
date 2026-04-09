import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cache } from 'cache-manager';
import { ILlmAdapter, LLM_ADAPTER } from '@ai-platform/ai-core';
import { FeedbackCache } from '../database/entities/feedback-cache.entity';
import { Lesson } from '../database/entities/lesson.entity';
import { LessonStep } from '../database/entities/lesson-step.entity';

@Injectable()
export class LessonCacheWarmerService {
  private readonly logger = new Logger(LessonCacheWarmerService.name);

  static readonly SCORE_BUCKETS: Record<string, [number, number]> = {
    excellent: [80, 100],
    good: [60, 79],
    medium: [40, 59],
    low: [0, 39],
  };

  static readonly COMMON_WEAK_PHONEMES = [
    '/θ/',
    '/ð/',
    '/r/',
    '/l/',
    '/ʃ/',
    '/ʒ/',
    '/z/',
  ];

  constructor(
    @Inject(LLM_ADAPTER) private readonly llm: ILlmAdapter,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    @InjectRepository(FeedbackCache)
    private readonly feedbackCacheRepo: Repository<FeedbackCache>,
  ) {}

  async warmLessonCache(
    lesson: Lesson,
    steps: LessonStep[],
  ): Promise<void> {
    this.logger.log(`Warming cache for lesson: ${lesson.title}`);

    for (const step of steps) {
      if (step.type === 'pronounce' || step.type === 'voice_quiz') {
        await this.warmPronunciationFeedback(step);
      }
      if (step.type === 'image_quiz' || step.type === 'voice_quiz') {
        await this.warmQuizFeedback(step);
      }
    }

    this.logger.log(`Cache warming complete for lesson: ${lesson.title}`);
  }

  async warmPronunciationFeedback(step: LessonStep): Promise<void> {
    const word =
      (step.config['word'] as string) ??
      (step.config['correct_answer'] as string);
    if (!word) return;

    for (const [bucketName, [minS, maxS]] of Object.entries(
      LessonCacheWarmerService.SCORE_BUCKETS,
    )) {
      // General feedback (no specific weak phoneme)
      const generalKey = `pron:${word}:${bucketName}:general`;
      const existingGeneral = await this.cache.get<string>(generalKey);
      if (!existingGeneral) {
        const midScore = Math.round((minS + maxS) / 2);
        const feedback = await this.generatePronFeedback(
          word,
          bucketName,
          midScore,
          null,
        );
        await this.cache.set(generalKey, feedback, 86400);
        await this.persistWarm(
          generalKey,
          'pronunciation',
          word,
          bucketName,
          null,
          feedback,
        );
      }

      // Feedback for each common weak phoneme
      for (const phoneme of LessonCacheWarmerService.COMMON_WEAK_PHONEMES) {
        const key = `pron:${word}:${bucketName}:${phoneme}`;
        const existing = await this.cache.get<string>(key);
        if (!existing) {
          const midScore = Math.round((minS + maxS) / 2);
          const feedback = await this.generatePronFeedback(
            word,
            bucketName,
            midScore,
            phoneme,
          );
          await this.cache.set(key, feedback, 86400);
          await this.persistWarm(
            key,
            'pronunciation',
            word,
            bucketName,
            phoneme,
            feedback,
          );
        }
      }
    }
  }

  async warmQuizFeedback(step: LessonStep): Promise<void> {
    const correct =
      (step.config['correct'] as string) ??
      (step.config['correct_answer'] as string);
    if (!correct) return;

    for (const result of ['correct', 'wrong'] as const) {
      const key = `quiz:${correct}:${result}`;
      const existing = await this.cache.get<string>(key);
      if (!existing) {
        const isCorrect = result === 'correct';
        const prompt =
          `Trẻ 6-10 tuổi trả lời ${isCorrect ? 'đúng' : 'sai'}, ` +
          `đáp án đúng là '${correct}'. ` +
          `${isCorrect ? 'Khen' : 'Động viên'} ngắn gọn 1 câu.`;
        const feedback = await this.llm.generate(prompt);
        await this.cache.set(key, feedback, 86400);
        await this.persistWarm(key, 'quiz', correct, null, null, feedback);
      }
    }
  }

  private async generatePronFeedback(
    word: string,
    bucket: string,
    score: number,
    weakPhoneme: string | null,
  ): Promise<string> {
    const phonemeHint = weakPhoneme
      ? `Âm yếu nhất: ${weakPhoneme}.`
      : '';
    const prompt =
      `Trẻ 6-10 tuổi đọc từ '${word}', điểm phát âm ~${score}/100.\n` +
      `${phonemeHint}\n` +
      `Feedback 1-2 câu, vui vẻ, phù hợp trẻ em.`;
    return this.llm.generate(prompt);
  }

  private async persistWarm(
    cacheKey: string,
    cacheType: string,
    word: string,
    scoreBucket: string | null,
    weakPhoneme: string | null,
    feedback: string,
  ): Promise<void> {
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
            scoreBucket,
            weakPhoneme,
            feedbackText: feedback,
            source: 'warm',
          }),
        );
      }
    } catch (err) {
      this.logger.warn(`Failed to persist warm cache: ${cacheKey}`, err);
    }
  }
}
