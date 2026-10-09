import { IsNotEmpty, IsString } from 'class-validator';

export class ExchangeSocialCodeDto {
  @IsString()
  @IsNotEmpty()
  code!: string;
}