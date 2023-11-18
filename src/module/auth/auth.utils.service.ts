import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { DatabaseService } from 'src/shared/database';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { JwtPayloadDto } from './dto';

@Injectable()
export class AuthUtilsService {
  protected readonly logger = new Logger(AuthUtilsService.name);
  private readonly algorithm = 'sha256';
  private readonly saltLength = 16; // You can adjust the salt length as needed
  private readonly hashIterations = 10000; // You can adjust the number of iterations as needed

  constructor(
    protected jwtService: JwtService,
    protected config: ConfigService,
    protected database: DatabaseService,
  ) {}

  async hashPassword(password: string): Promise<string> {
    const salt = crypto.randomBytes(this.saltLength).toString('hex');

    return new Promise((resolve, reject) => {
      crypto.pbkdf2(
        password,
        salt,
        this.hashIterations,
        64,
        this.algorithm,
        (err, derivedKey) => {
          if (err) {
            reject(err);
          } else {
            const hashedPassword = `${salt}:${derivedKey.toString('hex')}`;
            resolve(hashedPassword);
          }
        },
      );
    });
  }

  comparePasswords(
    unhashedPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const [salt, storedHash] = hashedPassword.split(':');
      crypto.pbkdf2(
        unhashedPassword,
        salt,
        this.hashIterations,
        64,
        this.algorithm,
        (err, derivedKey) => {
          if (err) {
            reject(err);
          } else {
            const currentHash = derivedKey.toString('hex');
            resolve(currentHash === storedHash);
          }
        },
      );
    });
  }

  protected async validateUserLogin(
    email: string,
    password: string,
  ): Promise<User | null> {
    let user: User;
    try {
      user = await this.database.user.findUnique({ where: { email } });
    } catch (error) {
      user = null;
    }

    if (!user) return null;

    const doesPasswordMatch = await this.comparePasswords(
      password,
      user.password,
    );
    if (!doesPasswordMatch) return null;

    return user;
  }

  protected async updateRefreshToken(userId: string, refreshToken: string) {
    await this.database.user.update({
      where: { id: userId },
      data: { refreshToken },
    });
  }

  protected async buildUserTokenResponse(user: User) {
    const { id, email } = user;
    const { accessToken, refreshToken } = await this.signTokens({
      sub: id,
      email,
    });
    await this.updateRefreshToken(id, refreshToken);
    return { accessToken, refreshToken };
  }

  protected async buildUserAccessToken(sub: string, email: string) {
    const accessToken = await this.jwtService.signAsync(
      { sub, email },
      {
        secret: this.config.get<string>('ACCESS_TOKEN_SECRET'),
        expiresIn: this.config.get<string>('ACCESS_TOKEN_EXPIRATION') || '15m',
      },
    );

    return { accessToken };
  }
  protected async doesPasswordMatch(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  protected async signTokens({ sub, email }: JwtPayloadDto) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub, email },
        {
          secret: this.config.get<string>('ACCESS_TOKEN_SECRET'),
          expiresIn: '15m',
          // this.config.get<string>('ACCESS_TOKEN_EXPIRATION') || '15m',
        },
      ),
      this.jwtService.signAsync(
        { sub, email },
        {
          secret: this.config.get<string>('REFRESH_TOKEN_SECRET'),
          expiresIn: '7d',
          // this.config.get<string>('REFRESH_TOKEN_EXPIRATION') || '7d',
        },
      ),
    ]);
    return {
      accessToken,
      refreshToken,
    };
  }
}
