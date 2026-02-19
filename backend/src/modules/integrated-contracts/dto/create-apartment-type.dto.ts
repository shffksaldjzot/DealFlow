import { IsString, IsOptional, IsNumber, Min, Length } from 'class-validator';

export class CreateApartmentTypeDto {
  @IsString()
  @Length(1, 100)
  name: string;

  @IsOptional()
  @IsString()
  floorPlanFileId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}
