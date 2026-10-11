import { IsIn, IsOptional } from 'class-validator';

export class TrackClickDto {
  @IsOptional()
  @IsIn(['coffee', 'supporter', 'hero', 'custom', 'header', 'menu'])
  tier?: string;
}