import {
  IsEmail,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  IsStrongPassword,
} from 'class-validator';

export class RegisterRequestDTO {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsPhoneNumber('EG')
  @IsNotEmpty()
  phoneNumber: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsStrongPassword()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsStrongPassword()
  @IsNotEmpty()
  confirmPassword: string;
}
