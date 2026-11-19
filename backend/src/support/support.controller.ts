import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req, ParseUUIDPipe } from '@nestjs/common';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ADMIN_ROLES, Roles } from '../auth/roles.decorator';
import { clampInt } from '../common/pagination';

class MessageDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'Message content is required' })
  @MaxLength(2000, { message: 'Messages are limited to 2,000 characters' })
  content: string;
}

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  // ── Customer (/support/conversations) ────────────────────────────────────
  @Post('support/conversations')
  async getOrCreateConversation(@Req() req: any) {
    return this.supportService.getOrCreateConversation(req.user.id);
  }

  @Get('support/conversations/:id/messages')
  async getCustomerMessages(@Req() req: any, @Param('id', new ParseUUIDPipe()) id: string, @Query('limit') limit?: string) {
    return this.supportService.getMessagesForCustomer(id, req.user.id, clampInt(limit, 100, 1, 200));
  }

  @Post('support/conversations/:id/messages')
  async sendCustomerMessage(@Req() req: any, @Param('id', new ParseUUIDPipe()) id: string, @Body() dto: MessageDto) {
    return this.supportService.sendMessageAsCustomer(id, req.user.id, dto.content);
  }

  // ── Admin (/admin/support/conversations) ─────────────────────────────────
  @Get('admin/support/conversations')
  @Roles(...ADMIN_ROLES)
  async getAllConversations(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.supportService.getAllConversations(clampInt(page, 1, 1, 10_000), clampInt(limit, 30, 1, 100));
  }

  @Get('admin/support/conversations/:id/messages')
  @Roles(...ADMIN_ROLES)
  async getAdminMessages(@Param('id', new ParseUUIDPipe()) id: string, @Query('limit') limit?: string) {
    return this.supportService.getMessagesForAdmin(id, clampInt(limit, 100, 1, 200));
  }

  @Post('admin/support/conversations/:id/messages')
  @Roles(...ADMIN_ROLES)
  async sendAdminMessage(@Req() req: any, @Param('id', new ParseUUIDPipe()) id: string, @Body() dto: MessageDto) {
    return this.supportService.sendMessageAsAdmin(id, req.user.id, dto.content);
  }

  @Patch('admin/support/conversations/:id/close')
  @Roles(...ADMIN_ROLES)
  async closeConversation(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.supportService.closeConversation(id);
  }
}
