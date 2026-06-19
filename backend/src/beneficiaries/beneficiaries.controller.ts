import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { BeneficiariesService } from './beneficiaries.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('beneficiaries')
@UseGuards(JwtAuthGuard)
export class BeneficiariesController {
  constructor(private readonly beneficiariesService: BeneficiariesService) {}

  @Get()
  async getMyBeneficiaries(@Req() req: any) {
    return this.beneficiariesService.getByUserId(req.user.id);
  }

  @Post()
  async create(@Req() req: any, @Body() dto: any) {
    return this.beneficiariesService.create(req.user.id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: any) {
    return this.beneficiariesService.delete(id, req.user.id);
  }
}
