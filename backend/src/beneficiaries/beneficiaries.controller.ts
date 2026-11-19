import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req, ParseUUIDPipe } from '@nestjs/common';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';
import { BeneficiariesService } from './beneficiaries.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

export class CreateBeneficiaryDto {
  @IsNotEmpty() @IsString() @MaxLength(80) beneficiaryName: string;
  @IsNotEmpty() @IsString() @Matches(/^[A-Za-z0-9-]{4,34}$/, { message: 'Enter a valid account number' }) accountNumber: string;
  @IsOptional() @IsString() @MaxLength(80) bankName?: string;
  @IsOptional() @IsString() @MaxLength(20) bankCode?: string;
  @IsOptional() @IsString() @Matches(/^[A-Za-z0-9]{8,11}$/, { message: 'Enter a valid SWIFT/BIC code' }) swiftCode?: string;
  @IsOptional() @IsString() @MaxLength(34) iban?: string;
  @IsOptional() @IsString() @Length(3, 3) currency?: string;
  @IsOptional() @IsString() @MaxLength(56) country?: string;
  @IsOptional() @IsBoolean() isInternational?: boolean;
}

@Controller('beneficiaries')
@UseGuards(JwtAuthGuard)
export class BeneficiariesController {
  constructor(private readonly beneficiariesService: BeneficiariesService) {}

  @Get()
  async getMyBeneficiaries(@Req() req: any) {
    return this.beneficiariesService.getByUserId(req.user.id);
  }

  @Post()
  async create(@Req() req: any, @Body() dto: CreateBeneficiaryDto) {
    return this.beneficiariesService.create(req.user.id, dto);
  }

  @Delete(':id')
  async delete(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: any) {
    return this.beneficiariesService.delete(id, req.user.id);
  }
}
