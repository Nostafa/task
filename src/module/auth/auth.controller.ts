import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Patch,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginRequestDTO, RegisterRequestDTO } from './dto';
import { AccessTokenGuard, RefreshTokenGuard } from 'src/module/auth/guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() loginRequestDTO: LoginRequestDTO) {
    return this.authService.login(loginRequestDTO);
  }

  @Post('register')
  register(@Body() registerRequestDTO: RegisterRequestDTO) {
    return this.authService.signup(registerRequestDTO);
  }

  @Get('refresh')
  @UseGuards(RefreshTokenGuard)
  refreshAccessToken(@Req() req: Request) {
    const refreshToken = req['user']['refreshToken'];
    const id = req['user']['sub'];
    return this.authService.refreshAccessToken(refreshToken, id);
  }

  @Patch('logout')
  @UseGuards(AccessTokenGuard)
  logout(@Req() req: Request) {
    const id = req['user']['sub'];
    return this.authService.logout(id);
  }
}
