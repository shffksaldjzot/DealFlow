export type OrgType = 'organizer' | 'partner';
export type OrgStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface Organization {
  id: string;
  type: OrgType;
  name: string;
  businessNumber: string;
  businessLicenseFileId?: string;
  representativeName?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  status: OrgStatus;
  approvedAt?: string;
  createdAt: string;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  user?: { id: string; name: string; email: string };
  joinedAt: string;
}
