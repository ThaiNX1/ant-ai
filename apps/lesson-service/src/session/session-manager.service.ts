import { Injectable, Logger } from '@nestjs/common';

export interface ActiveSession {
  robotId: string;
  studentId: string | null;
  mode: 'lesson' | 'free_talk' | 'idle';
  lessonId: string | null;
  lastActivity: number;
  connectedAt: number;
}

@Injectable()
export class SessionManagerService {
  private readonly logger = new Logger(SessionManagerService.name);
  private readonly sessions = new Map<string, ActiveSession>();

  onRobotConnect(robotId: string, studentId?: string): ActiveSession {
    const session: ActiveSession = {
      robotId,
      studentId: studentId ?? null,
      mode: 'idle',
      lessonId: null,
      lastActivity: Date.now(),
      connectedAt: Date.now(),
    };
    this.sessions.set(robotId, session);
    this.logger.log(`Robot connected: ${robotId}`);
    return session;
  }

  switchToLesson(robotId: string, lessonId: string): ActiveSession | null {
    const session = this.sessions.get(robotId);
    if (!session) {
      this.logger.warn(`No session found for robot: ${robotId}`);
      return null;
    }
    session.mode = 'lesson';
    session.lessonId = lessonId;
    session.lastActivity = Date.now();
    this.logger.log(`Robot ${robotId} switched to lesson: ${lessonId}`);
    return session;
  }

  switchToFreeTalk(robotId: string): ActiveSession | null {
    const session = this.sessions.get(robotId);
    if (!session) {
      this.logger.warn(`No session found for robot: ${robotId}`);
      return null;
    }
    session.mode = 'free_talk';
    session.lessonId = null;
    session.lastActivity = Date.now();
    this.logger.log(`Robot ${robotId} switched to free talk`);
    return session;
  }

  handleInput(
    robotId: string,
    event: Record<string, unknown>,
  ): ActiveSession | null {
    const session = this.sessions.get(robotId);
    if (!session) return null;
    session.lastActivity = Date.now();
    return session;
  }

  onRobotDisconnect(robotId: string): void {
    const session = this.sessions.get(robotId);
    if (session) {
      this.logger.log(
        `Robot disconnected: ${robotId}, was in ${session.mode} mode`,
      );
      this.sessions.delete(robotId);
    }
  }

  cleanupIdle(maxIdleSeconds = 300): string[] {
    const now = Date.now();
    const cleaned: string[] = [];

    for (const [robotId, session] of this.sessions.entries()) {
      const idleMs = now - session.lastActivity;
      if (idleMs > maxIdleSeconds * 1000) {
        this.logger.log(
          `Cleaning up idle session: ${robotId} (idle ${Math.round(idleMs / 1000)}s)`,
        );
        this.sessions.delete(robotId);
        cleaned.push(robotId);
      }
    }

    return cleaned;
  }

  getSession(robotId: string): ActiveSession | null {
    return this.sessions.get(robotId) ?? null;
  }

  getActiveSessions(): ActiveSession[] {
    return Array.from(this.sessions.values());
  }

  getActiveCount(): number {
    return this.sessions.size;
  }
}
