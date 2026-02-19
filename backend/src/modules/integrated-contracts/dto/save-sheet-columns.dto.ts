import {
  IsArray,
  IsOptional,
  IsString,
  IsNumber,
  IsUUID,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SheetColumnItemDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsUUID()
  apartmentTypeId?: string;

  @IsOptional()
  @IsString()
  customName?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}

export class SaveSheetColumnsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SheetColumnItemDto)
  columns: SheetColumnItemDto[];
}
