import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/user.entity';
import { randomBytes } from 'crypto';
import { addHours } from 'date-fns';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly repo: Repository<User>) {}

  // --- Find methods ---
  async findAll(): Promise<User[]> {
    return this.repo.find();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.repo.findOne({ where: { username } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  async findByVerificationToken(token: string): Promise<User | null> {
    return this.repo.findOne({ where: { emailVerificationToken: token } });
  }

  async findByPasswordResetToken(token: string): Promise<User | null> {
    return this.repo.findOne({ where: { passwordResetToken: token } });
  }

  // --- Create user ---
  async createUser(data: { username: string; email: string; password: string }): Promise<User> {
    const existingUsername = await this.findByUsername(data.username);
    if (existingUsername) throw new ConflictException('Username already taken');

    const existingEmail = await this.findByEmail(data.email);
    if (existingEmail) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = this.repo.create({
      username: data.username,
      email: data.email,
      password: passwordHash,
      isEmailVerified: false,
      emailVerificationToken: null,
      passwordResetToken: null,
      passwordResetExpires: null,
    });

    return this.repo.save(user);
  }

  // --- Validate password ---
  async validatePassword(user: User, plain: string): Promise<boolean> {
    return bcrypt.compare(plain, user.password);
  }

  // --- Email verification ---
  async generateEmailVerificationToken(userId: number): Promise<string> {
    const user = await this.findOne(userId);
    const token = randomBytes(32).toString('hex');
    user.emailVerificationToken = token;
    await this.repo.save(user);
    return token;
  }

  async verifyEmail(token: string): Promise<void> {
    const user = await this.findByVerificationToken(token);
    if (!user) throw new BadRequestException('Invalid token');

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    await this.repo.save(user);
  }

  // --- Password reset ---
  async generatePasswordReset(email: string): Promise<string> {
    const user = await this.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');

    const token = randomBytes(32).toString('hex');
    user.passwordResetToken = token;
    user.passwordResetExpires = addHours(new Date(), 1);

    await this.repo.save(user);
    return token;
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.findByPasswordResetToken(token);
    if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      throw new BadRequestException('Invalid or expired token');
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;

    await this.repo.save(user);
  }

  // --- Update user ---
  async updateUser(id: number, data: Partial<User>): Promise<User> {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 12);
    }
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  // --- Delete user ---
  async deleteUser(id: number): Promise<void> {
    await this.repo.delete(id);
  }

  // --- Aliases for controller ---
  create(data: { username: string; email: string; password: string }) {
    return this.createUser(data);
  }

  update(id: number, data: Partial<User>) {
    return this.updateUser(id, data);
  }

  remove(id: number) {
    return this.deleteUser(id);
  }
}
