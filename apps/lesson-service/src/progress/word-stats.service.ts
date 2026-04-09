import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentWordStats } from '../database/entities/student-word-stats.entity';

@Injectable()
export class WordStatsService {
  constructor(
    @InjectRepository(StudentWordStats)
    private readonly statsRepo: Repository<StudentWordStats>,
  ) {}

  async updateWordStats(
    studentId: string,
    word: string,
    language: string,
    isCorrect: boolean,
    pronunciationScore: number | null,
  ): Promise<StudentWordStats> {
    let stats = await this.statsRepo.findOne({
      where: { studentId, word, language },
    });

    if (!stats) {
      stats = this.statsRepo.create({
        studentId,
        word,
        language,
        totalAttempts: 0,
        correctAttempts: 0,
      });
    }

    stats.totalAttempts += 1;
    if (isCorrect) stats.correctAttempts += 1;
    stats.lastPracticedAt = new Date();

    if (pronunciationScore !== null) {
      if (
        stats.bestPronunciationScore === null ||
        pronunciationScore > stats.bestPronunciationScore
      ) {
        stats.bestPronunciationScore = pronunciationScore;
      }
      // Running average
      if (stats.avgPronunciationScore === null) {
        stats.avgPronunciationScore = pronunciationScore;
      } else {
        stats.avgPronunciationScore =
          (stats.avgPronunciationScore * (stats.totalAttempts - 1) +
            pronunciationScore) /
          stats.totalAttempts;
      }
    }

    stats.masteryLevel = this.calculateMasteryLevel(stats);
    return this.statsRepo.save(stats);
  }

  async getWeakWords(
    studentId: string,
    limit = 10,
  ): Promise<StudentWordStats[]> {
    return this.statsRepo.find({
      where: { studentId },
      order: { avgPronunciationScore: 'ASC' },
      take: limit,
    });
  }

  async updateMasteryLevel(
    studentId: string,
    word: string,
  ): Promise<void> {
    const stats = await this.statsRepo.findOne({
      where: { studentId, word },
    });
    if (!stats) return;

    stats.masteryLevel = this.calculateMasteryLevel(stats);
    await this.statsRepo.save(stats);
  }

  private calculateMasteryLevel(stats: StudentWordStats): string {
    const accuracy =
      stats.totalAttempts > 0
        ? stats.correctAttempts / stats.totalAttempts
        : 0;
    const avgScore = stats.avgPronunciationScore ?? 0;

    if (stats.totalAttempts === 0) return 'new';
    if (accuracy >= 0.9 && avgScore >= 80 && stats.totalAttempts >= 5)
      return 'mastered';
    if (accuracy >= 0.7 && avgScore >= 60 && stats.totalAttempts >= 3)
      return 'practiced';
    if (stats.totalAttempts >= 1) return 'learning';
    return 'new';
  }
}
