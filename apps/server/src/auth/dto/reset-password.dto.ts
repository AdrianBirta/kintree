import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  token!: string;

  // bcrypt ignoră tot ce depășește 72 de bytes, de aceea limita
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}