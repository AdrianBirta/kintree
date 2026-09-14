// messaging/dto/create-conversation.dto.ts
import { IsArray, ArrayMinSize, IsUUID, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateConversationDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  participantIds!: string[]; // NU include automat userul curent — se adaugă în service

  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string; // relevant doar pentru grup (2+ participanți în afară de tine)
}