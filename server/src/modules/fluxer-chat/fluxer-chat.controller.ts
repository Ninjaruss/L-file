import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiResponse,
} from '@nestjs/swagger';
import { FluxerChatService, FluxerMessage } from './fluxer-chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../../entities/user.entity';
import { FluxerAnnouncement } from '../../entities/fluxer-announcement.entity';

@ApiTags('fluxer-chat')
@Controller('fluxer-chat')
export class FluxerChatController {
  constructor(private readonly fluxerChatService: FluxerChatService) {}

  @Get('messages')
  @ApiOperation({ summary: 'Get recent messages from the #usogui channel' })
  @ApiOkResponse({ description: 'Array of message objects' })
  async getMessages(): Promise<FluxerMessage[]> {
    return this.fluxerChatService.getMessages();
  }

  @Get('announcement')
  @ApiOperation({ summary: 'Get the latest @everyone/@here announcement' })
  @ApiOkResponse({ description: 'Announcement object or null' })
  async getAnnouncement(): Promise<FluxerAnnouncement | null> {
    return this.fluxerChatService.getAnnouncement();
  }

  @Post('messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a message to #usogui as the logged-in user' })
  @ApiOkResponse({ description: 'The created message' })
  @ApiResponse({
    status: 403,
    description:
      'FLUXER_TOKEN_MISSING | FLUXER_TOKEN_EXPIRED | FLUXER_NO_PERMISSION',
  })
  async sendMessage(
    @CurrentUser() user: User,
    @Body() dto: SendMessageDto,
  ): Promise<FluxerMessage> {
    return this.fluxerChatService.sendMessage(user.id, dto.content);
  }
}
