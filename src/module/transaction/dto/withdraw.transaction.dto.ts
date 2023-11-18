import { IsIBAN, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class withdrawTransactionDTO {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  bankName: string;

  //   @IsCreditCard()
  @IsNotEmpty()
  @IsString()
  accountNumber: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  amount: number;

  @IsString()
  @IsNotEmpty()
  swiftCode: string;

  @IsIBAN()
  IBAN: string;
}
