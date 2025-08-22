import { IsNotEmpty, MinLength } from 'class-validator';

export class PasswordResetConfirmDto {
  @IsNotEmpty()
  token: string;

  @MinLength(8)
  newPassword: string;
}
