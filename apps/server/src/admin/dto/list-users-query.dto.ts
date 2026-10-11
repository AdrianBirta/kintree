import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export const USER_SORT_FIELDS = ['createdAt', 'lastLoginAt', 'email', 'firstName', 'lastName', 'members'] as const;

export class ListUsersQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsIn(['all', 'active', 'disabled'])
  status: 'all' | 'active' | 'disabled' = 'all';

  @IsOptional()
  @IsIn(['all', 'donors'])
  donor: 'all' | 'donors' = 'all';

  @IsOptional()
  @IsIn(USER_SORT_FIELDS as unknown as string[])
  sortBy: (typeof USER_SORT_FIELDS)[number] = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDir: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 10;
}