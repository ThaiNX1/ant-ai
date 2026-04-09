import { Lesson } from '../../database/entities/lesson.entity';
import { LessonStep } from '../../database/entities/lesson-step.entity';
import { Student } from '../../database/entities/student.entity';
import { LessonProgress } from '../../database/entities/lesson-progress.entity';
import { StepAttempt } from '../../database/entities/step-attempt.entity';

export interface LessonSession {
  lesson: Lesson;
  steps: LessonStep[];
  student: Student;
  progress: LessonProgress;
  pastAttempts: StepAttempt[];
}
