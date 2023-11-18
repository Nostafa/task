import { Prisma } from '@prisma/client';
import { IsEnum, IsNumberString, IsOptional } from 'class-validator';

export class PaginationDto {
  @IsNumberString()
  @IsOptional()
  page: string;

  @IsNumberString()
  @IsOptional()
  limit: string;

  @IsEnum(Prisma.SortOrder)
  @IsOptional()
  order: Prisma.SortOrder;
}
