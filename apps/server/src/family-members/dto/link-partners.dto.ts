import { IsUUID, IsOptional, IsEnum } from 'class-validator';

export enum PartnershipStatus {
  MARRIED = 'MARRIED',
  DIVORCED = 'DIVORCED',
  PARTNER = 'PARTNER',
  WIDOWED = 'WIDOWED',
}

export class LinkPartnersDto {
  @IsUUID()
  partnerAId!: string;

  @IsUUID()
  partnerBId!: string;

  @IsOptional()
  @IsEnum(PartnershipStatus)
  status?: PartnershipStatus;
}