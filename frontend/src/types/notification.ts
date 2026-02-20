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

/** Normalize backend notification (raw entity or DTO) into frontend Notification type */
export function normalizeNotification(raw: any): Notification {
  return {
    id: raw.id,
    userId: raw.userId,
    type: raw.type,
    title: raw.title,
    message: raw.message ?? raw.content ?? '',
    isRead: raw.isRead ?? (raw.status ? raw.status !== 'pending' : false),
    relatedId: raw.relatedId ?? raw.metadata?.relatedId ?? raw.contractId ?? undefined,
    relatedType: raw.relatedType ?? raw.metadata?.relatedType ?? (raw.contractId ? 'contract' : undefined),
    sentAt: raw.sentAt,
    readAt: raw.readAt ?? raw.sentAt,
    createdAt: raw.createdAt,
  };
}
