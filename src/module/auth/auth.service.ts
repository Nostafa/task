import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginRequestDTO, RegisterRequestDTO } from './dto';
import { User } from '@prisma/client';
import { AuthUtilsService } from './auth.utils.service';
@Injectable()
export class AuthService extends AuthUtilsService {
  // *****************************************************************************************************************/

  async signup({
    email,
    fullName,
    password,
    confirmPassword,
    phoneNumber,
  }: RegisterRequestDTO) {
    let userFound: User;

    try {
      userFound = await this.database.user.findUnique({
        where: { email },
      });
    } catch (error) {
      userFound = undefined;
    }

    if (userFound) {
      throw new ConflictException('Email is already exist.');
    }

    if (password !== confirmPassword) {
      throw new UnauthorizedException('Password does not match.');
    }

    const hashedPassword = await this.hashPassword(password);

    await this.database.user.create({
      data: { email, fullName, password: hashedPassword, phoneNumber },
    });

    return {
      message: 'Register successfully',
    };
  }

  // *****************************************************************************************************************/

  async login({ email, password }: LoginRequestDTO) {
    const user = await this.validateUserLogin(email, password);

    if (!user) {
      throw new UnauthorizedException('Email or password incorrect');
    }

    return await this.buildUserTokenResponse(user);
  }

  // *****************************************************************************************************************/

  async refreshAccessToken(token: string, userId: string) {
    const { refreshToken, email, id } = await this.database.user.findUnique({
      where: { id: userId },
      select: { refreshToken: true, id: true, email: true },
    });

    if (refreshToken !== token)
      throw new UnauthorizedException('Invalid refresh token');

    return await this.buildUserAccessToken(id, email);
  }

  async logout(id: string) {
    await this.database.user.update({
      where: { id },
      data: { refreshToken: null },
    });

    return { message: 'You logged out successfully' };
  }
}
