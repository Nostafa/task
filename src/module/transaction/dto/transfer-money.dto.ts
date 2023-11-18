import { IsNotEmpty, IsNumber, IsString, IsUUID, Min } from 'class-validator';

export class TransferMoneyDTO {
  @IsUUID()
  @IsString()
  @IsNotEmpty()
  receiverId: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  amount: number;
}
