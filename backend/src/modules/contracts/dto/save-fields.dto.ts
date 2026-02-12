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
import { Type } from 'class-transformer';
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
  @IsInt()
  @Min(1)
  pageNumber?: number;

  @IsNumber()
  positionX: number;

  @IsNumber()
  positionY: number;

  @IsNumber()
  width: number;

  @IsNumber()
  height: number;

  @IsOptional()
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
