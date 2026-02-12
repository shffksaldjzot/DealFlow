import { IsArray, ValidateNested, IsString, IsUUID, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class FieldValueDto {
  @IsUUID()
  fieldId: string;

  @IsOptional()
  @IsString()
  value?: string;
}

export class FillContractDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldValueDto)
  fieldValues: FieldValueDto[];
}
