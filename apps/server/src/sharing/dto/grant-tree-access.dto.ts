import { IsEmail, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ShareAccessLevel } from '@prisma/client';

export class GrantTreeAccessDto {
  @IsEmail()
  email!: string;

  @IsEnum(ShareAccessLevel)
  accessLevel!: ShareAccessLevel;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}