import { Injectable } from '@nestjs/common';
import { Student } from '../database/entities/student.entity';
import { LessonStep } from '../database/entities/lesson-step.entity';
import { LessonProgress } from '../database/entities/lesson-progress.entity';

@Injectable()
export class PromptBuilderService {
  buildBaseContext(student: Student, lessonTitle: string): string {
    return (
      `Bạn là giáo viên tiếng Anh trên robot cho trẻ ${student.age} tuổi.\n` +
      `Bài học: ${lessonTitle}\n` +
      `Tên học sinh: ${student.name}\n\n` +
      `QUY TẮC:\n` +
      `1. Giọng thân thiện, dễ hiểu, phù hợp trẻ em\n` +
      `2. Trả lời ngắn (1-2 câu) vì đây là hội thoại giọng nói\n` +
      `3. KHÔNG BAO GIỜ nói "sai" — dùng "gần đúng rồi", "thử lại nhé"\n` +
      `4. Giữ từ tiếng Anh, giải thích bằng tiếng Việt nếu cần`
    );
  }

  buildTeachPrompt(step: LessonStep): string {
    const config = step.config;
    return (
      `NHIỆM VỤ: Giảng nội dung sau cho trẻ, dùng giọng thân thiện.\n` +
      `NỘI DUNG: ${config['audio_text'] ?? ''}\n` +
      `TỪ VỰNG: ${config['word'] ?? ''} (${config['phonetic'] ?? ''})\n\n` +
      `Diễn đạt lại cho phù hợp trẻ em. Giữ từ tiếng Anh, giải thích bằng tiếng Việt.`
    );
  }

  buildPronunciationFeedbackPrompt(
    step: LessonStep,
    pronunciationResult: {
      score: number;
      phonemes?: Array<{ phoneme: string; score: number; status: string }>;
    },
    attempt: { current: number; max: number },
  ): string {
    const config = step.config;
    const word = config['word'] ?? '';
    const minScore = (config['min_score'] as number) ?? 50;

    let phonemeDetail = '';
    if (pronunciationResult.phonemes) {
      phonemeDetail = pronunciationResult.phonemes
        .map(
          (p) =>
            `  - ${p.phoneme}: ${p.score} ${p.score >= 70 ? '✅' : '⚠️'}`,
        )
        .join('\n');
    }

    return (
      `NHIỆM VỤ: Đưa feedback phát âm cho trẻ.\n` +
      `TỪ CẦN ĐỌC: ${word}\n` +
      `ĐIỂM: ${pronunciationResult.score}/100\n` +
      (phonemeDetail ? `CHI TIẾT:\n${phonemeDetail}\n` : '') +
      `LẦN THỬ: ${attempt.current}/${attempt.max}\n` +
      `NGƯỠNG ĐẠT: ${minScore}\n\n` +
      `Nếu đạt: khen + chuyển tiếp.\n` +
      `Nếu chưa đạt: động viên + hướng dẫn cụ thể âm yếu nhất.`
    );
  }

  buildQuizJudgePrompt(
    step: LessonStep,
    studentAnswer: string,
    inputType: 'voice' | 'touch',
  ): string {
    const config = step.config;
    const correctAnswer =
      (config['correct'] as string) ??
      (config['correct_answer'] as string) ??
      '';

    return (
      `NHIỆM VỤ: Đánh giá câu trả lời của trẻ.\n` +
      `CÂU HỎI: ${config['question_audio'] ?? ''}\n` +
      `ĐÁP ÁN ĐÚNG: ${correctAnswer}\n` +
      `TRẺ TRẢ LỜI: '${studentAnswer}' (qua ${inputType})\n\n` +
      `Trả lời JSON: {"correct": true/false, "feedback": "..."}\n` +
      `Lưu ý: trẻ em, chấp nhận phát âm gần đúng.`
    );
  }

  buildResumeGreetingPrompt(
    progress: LessonProgress,
    pastScores: Record<string, number>,
  ): string {
    const wordsLearned = Object.keys(pastScores).join(', ');
    const pausedAt = progress.pausedAt ?? progress.updatedAt;
    const hoursAgo = Math.round(
      (Date.now() - new Date(pausedAt).getTime()) / (1000 * 60 * 60),
    );

    return (
      `NHIỆM VỤ: Chào học sinh quay lại học tiếp.\n` +
      `ĐÃ HỌC ĐƯỢC: step ${progress.currentStep}/${progress.totalSteps}\n` +
      `CÁC TỪ ĐÃ HỌC: ${wordsLearned || 'chưa có'}\n` +
      `THỜI GIAN NGHỈ: ${hoursAgo} giờ\n\n` +
      `Chào ngắn gọn, nhắc lại từ đã học, rồi nói tiếp tục.`
    );
  }

  buildCompletionPrompt(finalScore: number): string {
    return (
      `NHIỆM VỤ: Tổng kết bài học cho trẻ.\n` +
      `ĐIỂM TỔNG: ${finalScore}/100\n\n` +
      `Khen ngợi thành tích, nhắc lại các từ đã học, khuyến khích học tiếp.\n` +
      `Giọng vui vẻ, tự hào. 2-3 câu ngắn.`
    );
  }
}
