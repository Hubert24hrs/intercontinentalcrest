import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, Patch, ParseUUIDPipe } from '@nestjs/common';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { KycService } from './kyc.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ADMIN_ROLES, Roles } from '../auth/roles.decorator';
import { clampInt } from '../common/pagination';

export class SubmitKycDto {
  @IsIn(['passport', 'drivers_license', 'national_id', 'residence_permit'], { message: 'Choose a document type' })
  documentType: string;

  @IsOptional() @IsString() @MaxLength(2048) documentFrontUrl?: string;
  @IsOptional() @IsString() @MaxLength(2048) documentBackUrl?: string;
  @IsOptional() @IsString() @MaxLength(2048) selfieUrl?: string;
  @IsOptional() @IsString() @MaxLength(2048) proofOfAddressUrl?: string;
}

export class ReviewKycDto {
  @IsIn(['approved', 'rejected'])
  status: 'approved' | 'rejected';

  @IsOptional() @IsString() @MaxLength(1000)
  reviewerNotes?: string;
}

@Controller('kyc')
@UseGuards(JwtAuthGuard, RolesGuard)
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Get('me')
  async getMyKyc(@Req() req: any) {
    return this.kycService.getMyKyc(req.user.id);
  }

  @Post('submit')
  async submit(@Req() req: any, @Body() dto: SubmitKycDto) {
    return this.kycService.submitKyc(req.user.id, dto);
  }

  // ── Admin ────────────────────────────────────────────────────────────────
  @Get('admin/all')
  @Roles(...ADMIN_ROLES)
  async getAllKyc(@Query('page') page?: string, @Query('limit') limit?: string, @Query('status') status?: string) {
    return this.kycService.getAllKyc(clampInt(page, 1, 1, 10_000), clampInt(limit, 20, 1, 200), status);
  }

  @Patch('admin/:id/review')
  @Roles(...ADMIN_ROLES)
  async reviewKyc(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: any, @Body() dto: ReviewKycDto) {
    return this.kycService.reviewKyc(id, req.user.id, dto);
  }
}
