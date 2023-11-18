import { Global, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthUtilsService } from './auth.utils.service';
import { AccessTokenStrategy, RefreshTokenStrategy } from './strategies';

@Global()
@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthUtilsService,
    RefreshTokenStrategy,
    AccessTokenStrategy,
  ],
  exports: [RefreshTokenStrategy, AccessTokenStrategy],
})
export class AuthModule {}
