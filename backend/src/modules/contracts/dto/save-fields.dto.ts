import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsInt,
  IsArray,
  ValidateNested,
  Length,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { FieldType } from '../entities/contract-field.entity';

export class FieldDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsEnum(FieldType)
  fieldType: FieldType;

  @IsString()
  @Length(1, 200)
  label: string;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  placeholder?: string;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @Transform(({ value }) => value != null ? parseInt(value, 10) : undefined)
  @IsInt()
  @Min(1)
  pageNumber?: number;

  @Transform(({ value }) => typeof value === 'string' ? parseFloat(value) : value)
  @IsNumber()
  positionX: number;

  @Transform(({ value }) => typeof value === 'string' ? parseFloat(value) : value)
  @IsNumber()
  positionY: number;

  @Transform(({ value }) => typeof value === 'string' ? parseFloat(value) : value)
  @IsNumber()
  width: number;

  @Transform(({ value }) => typeof value === 'string' ? parseFloat(value) : value)
  @IsNumber()
  height: number;

  @IsOptional()
  @Transform(({ value }) => value != null ? parseInt(value, 10) : undefined)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsString()
  defaultValue?: string;

  @IsOptional()
  validationRule?: any;
}

export class SaveFieldsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldDto)
  fields: FieldDto[];
}
