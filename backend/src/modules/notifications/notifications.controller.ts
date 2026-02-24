import { Controller, Get, Patch, Delete, Param, ParseUUIDPipe } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Notification, NotificationStatus } from './entities/notification.entity';

function toDto(n: Notification) {
  return {
    id: n.id,
    userId: n.userId,
    type: n.type,
    title: n.title,
    message: n.content || '',
    isRead: n.status !== NotificationStatus.PENDING,
    relatedId: n.metadata?.relatedId ?? n.contractId ?? null,
    relatedType: n.metadata?.relatedType ?? (n.contractId ? 'contract' : null),
    sentAt: n.sentAt,
    readAt: n.sentAt,
    createdAt: n.createdAt,
  };
}

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get()
  async listMyNotifications(@CurrentUser('id') userId: string) {
    const list = await this.notificationsService.listMyNotifications(userId);
    return list.map(toDto);
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser('id') userId: string) {
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  @Patch('read-all')
  markAllAsRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Patch(':id/read')
  async markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    const n = await this.notificationsService.markAsRead(id, userId);
    return toDto(n);
  }

  @Delete(':id')
  deleteNotification(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationsService.deleteNotification(id, userId);
  }

  @Delete()
  deleteAllRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.deleteAllRead(userId);
  }
}
