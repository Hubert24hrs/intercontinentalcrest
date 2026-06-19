import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Patch,
} from '@nestjs/common';
import { KycService } from './kyc.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('kyc')
@UseGuards(JwtAuthGuard)
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Get('me')
  async getMyKyc(@Req() req: any) {
    return this.kycService.getMyKyc(req.user.id);
  }

  @Post('submit')
  async submit(@Req() req: any, @Body() dto: any) {
    return this.kycService.submitKyc(req.user.id, dto);
  }

  // Admin routes
  @Get('admin/all')
  async getAllKyc(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status?: string,
  ) {
    return this.kycService.getAllKyc(parseInt(page), parseInt(limit), status);
  }

  @Patch('admin/:id/review')
  async reviewKyc(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: { status: 'approved' | 'rejected'; reviewerNotes?: string },
  ) {
    return this.kycService.reviewKyc(id, req.user.id, dto);
  }
}
