import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Ip,
  Query,
  Patch,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { AccessTokenGuard } from 'src/module/auth/guard';
import {
  CreatePaymobDTO,
  TransferMoneyDTO,
  withdrawTransactionDTO,
} from './dto';

@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post('paymob-api')
  @UseGuards(AccessTokenGuard)
  async createPaymentAPIFlow(
    @Body() data: CreatePaymobDTO,
    @Req() req: Request,
  ) {
    const id = req['user']['sub'];
    return this.transactionService.createPaymentAPIFlow(id, data);
  }

  //*****************************************************************************************************************************/

  @Post('paymob-callback')
  async getDataFromPaymob(
    @Body() data: any,
    @Query('hmac') hmac: string,
    @Ip() ip: string,
  ) {
    return this.transactionService.createPaymobTransaction(data, hmac, ip);
  }

  //*****************************************************************************************************************************/

  @Patch('transfer')
  @UseGuards(AccessTokenGuard)
  async transferMoney(@Body() data: TransferMoneyDTO, @Req() req: Request) {
    const id = req['user']['sub'];
    console.log(req['user']);
    return this.transactionService.transferMoney(data, id);
  }

  //*****************************************************************************************************************************/

  @Post('withdraw')
  @UseGuards(AccessTokenGuard)
  async withdrawTransaction(
    @Body() data: withdrawTransactionDTO,
    @Req() req: Request,
  ) {
    const id = req['user']['sub'];
    console.log(req['user']);

    return this.transactionService.withdrawTransaction(data, id);
  }
}
