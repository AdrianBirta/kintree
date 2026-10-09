import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  email!: string;

  // limba interfeței (ro, en, hu...), folosită pentru emailul trimis
  @IsOptional()
  @IsString()
  @MaxLength(10)
  lang?: string;
}