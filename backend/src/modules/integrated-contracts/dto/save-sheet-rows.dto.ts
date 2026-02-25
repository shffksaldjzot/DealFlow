import {
  IsArray,
  IsOptional,
  IsString,
  IsNumber,
  IsUUID,
  IsObject,
  ValidateNested,
  Min,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SheetRowItemDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsString()
  apartmentTypeId?: string;

  @IsString()
  @Length(1, 300)
  optionName: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  popupContent?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsObject()
  prices?: Record<string, number>;

  @IsOptional()
  @IsObject()
  cellValues?: Record<string, string>;
}

export class SaveSheetRowsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SheetRowItemDto)
  rows: SheetRowItemDto[];
}
