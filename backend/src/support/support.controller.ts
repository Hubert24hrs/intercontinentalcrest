import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private checkAdmin(req: any) {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      throw new ForbiddenException('Admin access required');
    }
  }

  // ─── Customer endpoints (/support/conversations) ──────────────────────────

  @Post('support/conversations')
  async getOrCreateConversation(@Req() req: any) {
    return this.supportService.getOrCreateConversation(req.user.id);
  }

  @Get('support/conversations/:id/messages')
  async getCustomerMessages(
    @Req() req: any,
    @Param('id') id: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '100',
  ) {
    return this.supportService.getMessagesForCustomer(
      id,
      req.user.id,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }

  @Post('support/conversations/:id/messages')
  async sendCustomerMessage(
    @Req() req: any,
    @Param('id') id: string,
    @Body('content') content: string,
  ) {
    if (!content?.trim()) {
      throw new BadRequestException('Message content is required');
    }
    return this.supportService.sendMessageAsCustomer(
      id,
      req.user.id,
      content.trim(),
    );
  }

  // ─── Admin endpoints (/admin/support/conversations) ───────────────────────

  @Get('admin/support/conversations')
  async getAllConversations(
    @Req() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '30',
  ) {
    this.checkAdmin(req);
    return this.supportService.getAllConversations(
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }

  @Get('admin/support/conversations/:id/messages')
  async getAdminMessages(
    @Req() req: any,
    @Param('id') id: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '100',
  ) {
    this.checkAdmin(req);
    return this.supportService.getMessagesForAdmin(
      id,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }

  @Post('admin/support/conversations/:id/messages')
  async sendAdminMessage(
    @Req() req: any,
    @Param('id') id: string,
    @Body('content') content: string,
  ) {
    this.checkAdmin(req);
    if (!content?.trim()) {
      throw new BadRequestException('Message content is required');
    }
    return this.supportService.sendMessageAsAdmin(id, req.user.id, content.trim());
  }

  @Patch('admin/support/conversations/:id/close')
  async closeConversation(@Req() req: any, @Param('id') id: string) {
    this.checkAdmin(req);
    return this.supportService.closeConversation(id);
  }
}
