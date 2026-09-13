import { IsOptional, IsString, MaxLength } from 'class-validator';

export class JoinShareLinkDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  displayName?: string;
}