// === 설정 ===
export type IcConfigStatus = 'draft' | 'active' | 'closed';
export type IcSheetStatus = 'draft' | 'active' | 'inactive';
export type IcContractStatus = 'draft' | 'signed' | 'completed' | 'cancelled';

export interface PaymentStage {
  name: string;
  ratio: number;
}

export interface IcConfig {
  id: string;
  eventId: string;
  paymentStages: PaymentStage[];
  legalTerms?: string;
  specialNotes?: string;
  categories?: string[];
  status: IcConfigStatus;
  apartmentTypes: IcApartmentType[];
  event?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

// === 아파트 타입 ===
export interface IcApartmentType {
  id: string;
  configId: string;
  name: string;
  floorPlanFileId?: string;
  sortOrder: number;
  createdAt: string;
}

// === 시트 ===
export interface IcPartnerSheet {
  id: string;
  configId: string;
  partnerId: string;
  categoryName: string;
  memo?: string;
  status: IcSheetStatus;
  commissionRate?: number;
  columns: IcSheetColumn[];
  rows: IcSheetRow[];
  partner?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface IcSheetColumn {
  id: string;
  sheetId: string;
  apartmentTypeId?: string;
  customName?: string;
  columnType: 'text' | 'amount';
  sortOrder: number;
  apartmentType?: IcApartmentType;
  createdAt: string;
}

export interface IcSheetRow {
  id: string;
  sheetId: string;
  optionName: string;
  popupContent?: string;
  sortOrder: number;
  prices: Record<string, number>;
  cellValues?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

// === 계약 ===
export interface IcSelectedItem {
  sheetId: string;
  rowId: string;
  columnId: string;
  optionName: string;
  categoryName: string;
  partnerName: string;
  unitPrice: number;
}

export interface IcPaymentScheduleItem {
  name: string;
  ratio: number;
  amount: number;
}

export interface IcContract {
  id: string;
  configId: string;
  apartmentTypeId: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  unitNumber?: string;
  shortCode: string;
  selectedItems: IcSelectedItem[];
  totalAmount: number;
  paymentSchedule: IcPaymentScheduleItem[];
  legalAgreed: boolean;
  signatureData?: string;
  specialNotes?: string;
  status: IcContractStatus;
  signedAt?: string;
  config?: IcConfig;
  apartmentType?: IcApartmentType;
  customer?: { id: string; name: string; email?: string };
  createdAt: string;
  updatedAt: string;
}

// === 데이터 병합 (contract-flow) ===
export interface IcFlowOption {
  rowId: string;
  optionName: string;
  popupContent?: string;
  sortOrder: number;
  prices: Record<string, number>;
  cellValues?: Record<string, string>;
  unitPrice?: number | null;
  columnId?: string | null;
}

export interface IcFlowCategory {
  sheetId: string;
  categoryName: string;
  commissionRate?: number;
  columns: {
    id: string;
    apartmentTypeId: string;
    customName: string;
    columnType: 'text' | 'amount';
    sortOrder: number;
  }[];
  options: IcFlowOption[];
}

export interface IcFlowPartner {
  partnerId: string;
  partnerName: string;
  partnerItems?: string;
  categories: IcFlowCategory[];
}

export interface IcContractFlow {
  config: IcConfig;
  apartmentTypes: IcApartmentType[];
  partners: IcFlowPartner[];
  selectedTypeId?: string;
}
