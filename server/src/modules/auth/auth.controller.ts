import { Body, Controller, Get, Post, Request, UseGuards, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { PasswordResetRequestDto } from './dto/password-reset-request.dto';
import { PasswordResetConfirmDto } from './dto/password-reset-confirm.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(@Body() _dto: LoginDto, @Request() req) {
    return this.auth.login(req.user);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Request() req) {
    console.log("/me request: " + req.user); // Should print { id, username, email, role }
    return req.user;
  }

  // --- Email verification ---
  @Get('verify-email')
  async verifyEmail(@Query() dto: VerifyEmailDto) {
    return this.auth.verifyEmail(dto.token);
  }

  // --- Password reset request ---
  @Post('password-reset/request')
  async requestPasswordReset(@Body() dto: PasswordResetRequestDto) {
    return this.auth.requestPasswordReset(dto.email);
  }

  // --- Password reset confirm ---
  @Post('password-reset/confirm')
  async resetPassword(@Body() dto: PasswordResetConfirmDto) {
    return this.auth.resetPassword(dto.token, dto.newPassword);
  }
}
