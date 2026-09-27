import { IsIn, IsOptional } from 'class-validator';

export class TrackClickDto {
  @IsOptional()
  @IsIn(['coffee', 'supporter', 'hero', 'custom'])
  tier?: string;
}