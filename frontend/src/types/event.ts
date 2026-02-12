export type EventStatus = 'draft' | 'active' | 'closed' | 'cancelled';
export type EventPartnerStatus = 'pending' | 'approved' | 'rejected';

export interface Event {
  id: string;
  organizerId: string;
  name: string;
  description?: string;
  venue?: string;
  startDate: string;
  endDate: string;
  isPrivate: boolean;
  inviteCode: string;
  commissionRate: number;
  status: EventStatus;
  createdAt: string;
  organizer?: { id: string; name: string };
}

export interface EventPartner {
  id: string;
  eventId: string;
  partnerId: string;
  status: EventPartnerStatus;
  commissionRate?: number;
  approvedAt?: string;
  partner?: { id: string; name: string };
  createdAt: string;
}
