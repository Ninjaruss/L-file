import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../../entities/user.entity';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwt: JwtService,
  ) {}

  // --- Validate login ---
  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByUsername(username);
    if (!user) return null;
    const ok = await this.usersService.validatePassword(user, password);
    if (!ok) return null;

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Email not verified');
    }

    return user;
  }

  // --- JWT token ---
  signToken(user: User) {
    const payload = { sub: user.id, username: user.username, role: user.role };
    return this.jwt.sign(payload);
  }

  async login(user: User) {
    const access_token = this.signToken(user);
    return {
      access_token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
    };
  }

  // --- Registration ---
  async register(data: { username: string; email: string; password: string }) {
    const user = await this.usersService.createUser(data);

    const token = await this.usersService.generateEmailVerificationToken(user.id);
    console.log(`(line 47 auth.service) Email verification token: ${token}`);

    // Send email with link: `${FRONTEND_URL}/verify-email?token=${token}`
    return { message: 'Registration successful. Please verify your email.' };
  }

  // --- Verify email ---
  async verifyEmail(token: string) {
    await this.usersService.verifyEmail(token);
    return { message: 'Email successfully verified' };
  }

  // --- Password reset ---
  async requestPasswordReset(email: string) {
    const token = await this.usersService.generatePasswordReset(email);
    console.log(`(line 62 auth.service) generatePassword token: ${token}`);

    // Send email with link: `${FRONTEND_URL}/password-reset?token=${token}`
    return { message: 'Password reset link sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    await this.usersService.resetPassword(token, newPassword);
    return { message: 'Password successfully reset' };
  }
}
