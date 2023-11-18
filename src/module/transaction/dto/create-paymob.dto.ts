import { IsEnum, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export enum Currency {
  EGP = 'EGP',
}

export enum PaymentMethod {
  Card = 'Card',
  Wallet = 'Wallet',
}

export class CreatePaymobDTO {
  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  paymentMethod: PaymentMethod;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  amount: number;

  @IsString()
  @IsNotEmpty()
  @IsEnum(Currency)
  currency: Currency;
}
