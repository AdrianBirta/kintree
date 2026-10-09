import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  // bcrypt ignoră tot ce depășește 72 de bytes
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @IsString()
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @MaxLength(100)
  lastName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  inviteToken?: string;

  // limba interfeței, folosită pentru emailul de confirmare
  @IsOptional()
  @IsString()
  @MaxLength(10)
  lang?: string;
}