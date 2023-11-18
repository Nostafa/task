import { Currency } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';

export class UpdateAccountDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  fullName: string;

  @IsPhoneNumber()
  @IsOptional()
  phoneNumber: string;

  @IsEmail()
  @IsOptional()
  email: string;

  @IsEnum(Currency)
  @IsOptional()
  currency: Currency;
}
