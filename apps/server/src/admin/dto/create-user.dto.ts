import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class AdminCreateUserDto {
  @IsEmail()
  email!: string;

  // bcrypt ignoră tot ce depășește 72 de bytes
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName!: string;
}