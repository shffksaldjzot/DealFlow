import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

export class SelectedItemDto {
  @IsUUID()
  sheetId: string;

  @IsUUID()
  rowId: string;

  @IsUUID()
  columnId: string;
}

export class CreateIcContractDto {
  @IsUUID()
  configId: string;

  @IsUUID()
  apartmentTypeId: string;

  @IsArray()
  selectedItems: SelectedItemDto[];

  @IsBoolean()
  legalAgreed: boolean;

  @IsString()
  signatureData: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  customerName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  customerPhone?: string;

  @IsOptional()
  @IsString()
  specialNotes?: string;
}
