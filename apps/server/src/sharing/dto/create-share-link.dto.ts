import { IsEnum, IsOptional, IsInt, Min, IsDateString, IsString, MaxLength } from 'class-validator';
import { ShareAccessLevel } from '@prisma/client';

export class CreateShareLinkDto {
  @IsEnum(ShareAccessLevel)
  accessLevel!: ShareAccessLevel;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number;

  // NOU — câți membri poate adăuga FIECARE invitat care intră cu acest link.
  // Undefined/null = nelimitat.
  @IsOptional()
  @IsInt()
  @Min(1)
  maxMembersPerGuest?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string;
}