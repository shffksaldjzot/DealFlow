import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationType,
  NotificationStatus,
} from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async listMyNotifications(userId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, status: NotificationStatus.PENDING },
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });
    if (!notification) {
      throw new NotFoundException('알림을 찾을 수 없습니다.');
    }

    notification.status = NotificationStatus.SENT;
    notification.sentAt = new Date();
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, status: NotificationStatus.PENDING },
      { status: NotificationStatus.SENT, sentAt: new Date() },
    );
  }

  async createNotification(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    relatedId?: string;
    relatedType?: string;
  }): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId: data.userId,
      type: NotificationType.PUSH,
      title: data.title,
      content: data.message,
      contractId: data.relatedType === 'contract' ? data.relatedId : null,
      status: NotificationStatus.PENDING,
      metadata: {
        relatedId: data.relatedId,
        relatedType: data.relatedType,
      },
    });

    return this.notificationRepository.save(notification);
  }

  async sendContractNotification(
    userId: string,
    contractId: string,
    type: string,
  ): Promise<Notification> {
    const titleMap: Record<string, string> = {
      contract_created: '새 계약서가 생성되었습니다',
      contract_signed: '계약서가 서명되었습니다',
      contract_completed: '계약이 완료되었습니다',
      contract_cancelled: '계약이 취소되었습니다',
      contract_in_progress: '계약서 작성이 시작되었습니다',
    };

    const contentMap: Record<string, string> = {
      contract_created: '새로운 계약서가 생성되어 고객의 서명을 기다리고 있습니다.',
      contract_signed: '고객이 계약서에 서명을 완료했습니다. 확인해 주세요.',
      contract_completed: '계약이 성공적으로 완료되었습니다.',
      contract_cancelled: '계약이 취소되었습니다. 상세 내용을 확인해 주세요.',
      contract_in_progress: '고객이 계약서 작성을 시작했습니다.',
    };

    const notification = this.notificationRepository.create({
      userId,
      contractId,
      type: NotificationType.PUSH,
      title: titleMap[type] || '계약 관련 알림',
      content: contentMap[type] || '계약 관련 업데이트가 있습니다.',
      status: NotificationStatus.PENDING,
      metadata: { notificationType: type },
    });

    return this.notificationRepository.save(notification);
  }
}
