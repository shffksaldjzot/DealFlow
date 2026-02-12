export type ContractStatus = 'pending' | 'in_progress' | 'signed' | 'completed' | 'cancelled';
export type FieldType = 'text' | 'number' | 'checkbox' | 'amount' | 'date' | 'signature';

export interface ContractTemplate {
  id: string;
  eventId: string;
  partnerId: string;
  name: string;
  fileId: string;
  fileType: 'pdf' | 'jpg' | 'png';
  pageCount: number;
  fields?: ContractField[];
  createdAt: string;
}

export interface ContractField {
  id: string;
  templateId: string;
  fieldType: FieldType;
  label: string;
  placeholder?: string;
  isRequired: boolean;
  pageNumber: number;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  sortOrder: number;
  defaultValue?: string;
  validationRule?: Record<string, any>;
}

export interface Contract {
  id: string;
  contractNumber: string;
  templateId: string;
  eventId: string;
  partnerId: string;
  customerId?: string;
  qrCode: string;
  qrCodeUrl?: string;
  status: ContractStatus;
  signedPdfFileId?: string;
  totalAmount?: number;
  cancelReason?: string;
  signedAt?: string;
  completedAt?: string;
  createdAt: string;
  template?: ContractTemplate;
  event?: { id: string; name: string };
  customer?: { id: string; name: string; email: string };
}

export interface ContractFieldValue {
  fieldId: string;
  value: string;
}

export interface ContractSignature {
  signatureData: string; // base64
}
