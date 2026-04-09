import { Injectable, Logger } from '@nestjs/common';

export interface VoiceInstance {
  instanceId: string;
  host: string;
  port: number;
  activeCount: number;
  lastHeartbeat: number;
}

@Injectable()
export class SessionRouterService {
  private readonly logger = new Logger(SessionRouterService.name);
  private readonly instances = new Map<string, VoiceInstance>();
  private readonly robotAssignments = new Map<string, string>(); // robotId → instanceId

  registerInstance(
    instanceId: string,
    host: string,
    port: number,
  ): void {
    this.instances.set(instanceId, {
      instanceId,
      host,
      port,
      activeCount: 0,
      lastHeartbeat: Date.now(),
    });
    this.logger.log(`Registered voice instance: ${instanceId} at ${host}:${port}`);
  }

  updateHeartbeat(instanceId: string, activeCount: number): void {
    const instance = this.instances.get(instanceId);
    if (instance) {
      instance.activeCount = activeCount;
      instance.lastHeartbeat = Date.now();
    }
  }

  assignInstance(robotId: string): VoiceInstance | null {
    // Check existing assignment
    const existingId = this.robotAssignments.get(robotId);
    if (existingId) {
      const existing = this.instances.get(existingId);
      if (existing) return existing;
      // Stale assignment, remove it
      this.robotAssignments.delete(robotId);
    }

    // Find least-loaded instance
    const healthyInstances = Array.from(this.instances.values()).filter(
      (i) => Date.now() - i.lastHeartbeat < 60_000, // healthy = heartbeat within 60s
    );

    if (healthyInstances.length === 0) {
      this.logger.warn('No healthy voice instances available');
      return null;
    }

    const leastLoaded = healthyInstances.reduce((min, i) =>
      i.activeCount < min.activeCount ? i : min,
    );

    this.robotAssignments.set(robotId, leastLoaded.instanceId);
    leastLoaded.activeCount++;
    this.logger.log(
      `Assigned robot ${robotId} to instance ${leastLoaded.instanceId}`,
    );
    return leastLoaded;
  }

  releaseAssignment(robotId: string): void {
    const instanceId = this.robotAssignments.get(robotId);
    if (instanceId) {
      const instance = this.instances.get(instanceId);
      if (instance && instance.activeCount > 0) {
        instance.activeCount--;
      }
      this.robotAssignments.delete(robotId);
    }
  }
}
