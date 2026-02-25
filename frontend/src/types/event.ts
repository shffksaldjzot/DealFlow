export type EventStatus = 'draft' | 'active' | 'closed' | 'cancelled';
export type EventPartnerStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

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
  bannerImageUrl?: string;
  themeColor?: string;
  status: EventStatus;
  createdAt: string;
  organizer?: { id: string; name: string };
  partners?: EventPartner[];
}

export interface EventPartner {
  id: string;
  eventId: string;
  partnerId: string;
  status: EventPartnerStatus;
  commissionRate?: number;
  items?: string;
  approvedAt?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancelReason?: string;
  partner?: { id: string; name: string; contactPhone?: string; contactEmail?: string; items?: string };
  createdAt: string;
}

export interface EventVisit {
  id: string;
  eventId: string;
  customerId: string;
  status: 'reserved' | 'cancelled';
  visitDate: string;
  guestCount: number;
  memo?: string;
  createdAt: string;
  event?: Event;
}
