import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MessagingService } from './messaging.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

@UseGuards(JwtAccessGuard)
@Controller('messaging')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) { }

  @Get('contacts')
  listContacts(@CurrentUser() user: { userId: string }) {
    return this.messagingService.listMessageableContacts(user.userId);
  }

  @Post('conversations')
  createConversation(@CurrentUser() user: { userId: string }, @Body() dto: CreateConversationDto) {
    return this.messagingService.createOrGetConversation(user.userId, dto);
  }

  @Get('conversations')
  listConversations(@CurrentUser() user: { userId: string }) {
    return this.messagingService.listConversations(user.userId);
  }

  @Get('conversations/:id/messages')
  getMessages(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Query('after') after?: string,
  ) {
    return this.messagingService.getMessages(user.userId, id, after);
  }

  @Post('conversations/:id/messages')
  sendMessage(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.messagingService.sendMessage(user.userId, id, dto);
  }

  @Post('conversations/:id/read')
  markAsRead(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.messagingService.markAsRead(user.userId, id);
  }
}