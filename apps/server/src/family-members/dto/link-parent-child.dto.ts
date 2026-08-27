import { IsUUID } from 'class-validator';

export class LinkParentChildDto {
  @IsUUID()
  parentId!: string;

  @IsUUID()
  childId!: string;
}