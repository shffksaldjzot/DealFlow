import { IsString, IsOptional } from 'class-validator';

export class SignContractDto {
  @IsString()
  signatureData: string;

  @IsOptional()
  @IsString()
  signerName?: string;
}
