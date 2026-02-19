import { IsString, IsOptional, IsUUID, Length } from 'class-validator';

export class CreateIcSheetDto {
  @IsUUID()
  configId: string;

  @IsString()
  @Length(1, 200)
  categoryName: string;

  @IsOptional()
  @IsString()
  memo?: string;
}
