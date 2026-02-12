export interface Notification {
  id: string;
  userId: string;
  type: 'alimtalk' | 'push' | 'email' | 'in_app';
  title: string;
  message: string;
  isRead: boolean;
  relatedId?: string;
  relatedType?: string;
  sentAt?: string;
  readAt?: string;
  createdAt: string;
}
