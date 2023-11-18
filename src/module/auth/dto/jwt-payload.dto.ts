import { IsEmail, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class JwtPayloadDto {
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  sub: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}
