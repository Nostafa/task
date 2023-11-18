import { Module } from '@nestjs/common';
import { AccountModule } from './account/account.module';
import { TransactionModule } from './transaction/transaction.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from 'src/shared/database';

@Module({
  imports: [AccountModule, TransactionModule, AuthModule, DatabaseModule],
})
export class ModuleModule {}
