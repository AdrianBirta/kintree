import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateDonationDto {
  // opțional: donație legată de un cont existent
  @IsOptional()
  @IsUUID()
  userId?: string;

  // pentru donatori fără cont
  @IsOptional()
  @IsString()
  @MaxLength(121)
  donorName?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsIn(['RON', 'EUR', 'USD'])
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsOptional()
  @IsDateString()
  donatedAt?: string;
}