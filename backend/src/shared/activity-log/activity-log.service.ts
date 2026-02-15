import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from '../../modules/admin/entities/activity-log.entity';

@Injectable()
export class ActivityLogService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
  ) {}

  async log(
    action: string,
    description: string,
    userId?: string,
    targetType?: string,
    targetId?: string,
    metadata?: any,
  ): Promise<ActivityLog> {
    const entry = this.activityLogRepository.create({
      action,
      description,
      userId: userId || null,
      targetType: targetType || null,
      targetId: targetId || null,
      metadata: metadata || null,
    });
    return this.activityLogRepository.save(entry);
  }
}
