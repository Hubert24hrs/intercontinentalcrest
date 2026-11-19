import { Module } from '@nestjs/common';
import { CryptoService } from './crypto.service';
import { CryptoController } from './crypto.controller';
import { PublicMarketsController } from './public-markets.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [CryptoController, PublicMarketsController],
  providers: [CryptoService],
  exports: [CryptoService],
})
export class CryptoModule {}
