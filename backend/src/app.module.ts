import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AccountsModule } from './accounts/accounts.module';
import { TransactionsModule } from './transactions/transactions.module';
import { BeneficiariesModule } from './beneficiaries/beneficiaries.module';
import { KycModule } from './kyc/kyc.module';
import { LoansModule } from './loans/loans.module';
import { InvestmentsModule } from './investments/investments.module';
import { CryptoModule } from './crypto/crypto.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';
import { WalletsModule } from './wallets/wallets.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    AccountsModule,
    TransactionsModule,
    BeneficiariesModule,
    KycModule,
    LoansModule,
    InvestmentsModule,
    CryptoModule,
    NotificationsModule,
    AdminModule,
    WalletsModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}

