import { IsString, IsOptional, IsEnum, Length } from 'class-validator';
import { IcSheetStatus } from '../entities/ic-partner-sheet.entity';

export class UpdateIcSheetDto {
  @IsOptional()
  @IsString()
  @Length(1, 200)
  categoryName?: string;

  @IsOptional()
  @IsString()
  memo?: string;

  @IsOptional()
  @IsEnum(IcSheetStatus)
  status?: IcSheetStatus;
}
