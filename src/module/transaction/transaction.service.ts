import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DatabaseService } from 'src/shared/database';
import {
  CreatePaymobDTO,
  TransferMoneyDTO,
  withdrawTransactionDTO,
} from './dto';
import { HttpService } from '@nestjs/axios';
import { Transaction } from './simple';
import { Prisma, TransactionStatus } from '@prisma/client';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class TransactionService {
  protected readonly logger = new Logger(TransactionService.name);
  constructor(
    private readonly database: DatabaseService,
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {}
  async createPaymentAPIFlow(
    id: string,
    { amount, currency, paymentMethod }: CreatePaymobDTO,
  ) {
    amount = amount * 100;

    const user = await this.database.user.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!user) throw new UnauthorizedException();
    let integration_id: number;
    if (paymentMethod === 'Card') {
      integration_id = this.config.get<number>('INTEGRATION_ID_CARD');
    }
    if (paymentMethod === 'Wallet') {
      integration_id = this.config.get<number>('INTEGRATION_ID_WALLET');
    }
    const iframe_id = this.config.get<number>('IFRAME_ID');
    const api_key = this.config.get<string>('API_KEY');

    const authUrl = 'https://accept.paymob.com/api/auth/tokens';

    const orderUrl = 'https://accept.paymob.com/api/ecommerce/orders';

    const paymentKey = 'https://accept.paymob.com/api/acceptance/payment_keys';
    try {
      const auth = await this.httpService.axiosRef.post(authUrl, { api_key });
      const order = await this.httpService.axiosRef.post(orderUrl, {
        auth_token: auth.data.token,
        delivery_needed: false,
        amount_cents: amount,
        currency,
        shipping_data: {
          email: id,
          first_name: 'Clifford',
          last_name: 'Nicolas',
          phone_number: '01122334455',
        },
        items: [],
      });

      const paymentToken = await this.httpService.axiosRef
        .post(paymentKey, {
          auth_token: auth.data.token,
          amount_cents: amount,
          expiration: 3600,
          order_id: order.data.id,
          billing_data: {
            apartment: 'NA',
            email: 'NA',
            floor: 'NA',
            first_name: 'NA',
            street: 'NA',
            building: 'NA',
            phone_number: 'NA',
            shipping_method: 'NA',
            postal_code: 'NA',
            city: 'NA',
            country: 'NA',
            last_name: 'NA',
            state: 'NA',
          },
          currency,
          integration_id,
        })
        .then((data) => data.data.token);
      this.logger.log(
        `create payment url with balance ${amount} from userId: ${user.id}`,
      );

      if (paymentMethod === 'Card') {
        return {
          data: {
            paymentLink: `https://accept.paymobsolutions.com/api/acceptance/iframes/${iframe_id}?payment_token=${paymentToken}`,
          },
        };
      }
      if (paymentMethod === 'Wallet') {
        return { data: { token: paymentToken } };
      }
    } catch (error) {
      this.logger.error(error.message);
      throw new UnprocessableEntityException(error.message);
    }
  }

  //*****************************************************************************************************************************/

  async createPaymobTransaction(data: Transaction, hmac: string, ip: any) {
    const { amount, success, transactionId, userId, source_data_type } =
      await this._hmacCalculation(data, hmac, ip);

    const newAmount = amount / 100;
    try {
      await this.database.$transaction(
        async (tx) => {
          let status: TransactionStatus;

          switch (success) {
            case true:
              status = 'Completed';
              break;
            case false:
              status = 'Failed';
              break;
          }
          const transaction = await tx.transaction.create({
            data: {
              transactionId,
              amount: newAmount,
              paymentType: source_data_type,
              success,
              currency: 'EGP',
              status,
              type: 'DEPOSIT',
              receiverId: userId,
            },
          });

          if (transaction.status === 'Completed') {
            const lastbalance = await tx.user.findUnique({
              where: { id: userId },
              select: { balance: true },
            });
            const newBalance = lastbalance.balance + newAmount;
            const user = await tx.user.update({
              where: { id: userId },
              data: { balance: newBalance },
            });
            this.logger.log(
              `Paymob transaction successful for userId: ${userId} and transaction number ${transactionId}`,
            );
            return {
              message: `Paymob transaction successes from Paymob to userId ${user.id}`,
            };
          }
          if (transaction.status === 'Failed') {
            const user = await tx.user.findUnique({
              where: { id: userId },
              select: { id: true },
            });
            this.logger.error(
              `Paymob transaction failed for userId: ${userId} and transaction number ${transactionId}`,
            );
            return {
              message: `Paymob transaction failed from Paymob with amount ${newAmount} to userId ${user.id}`,
            };
          }
        },
        {
          maxWait: 10000, // default: 2000
          timeout: 100000, // default: 5000
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable, // optional, default defined by database configuration
        },
      );
    } catch (error) {
      this.logger.error(error.message);
    }
  }

  //*****************************************************************************************************************************/

  async withdrawTransaction(
    {
      IBAN,
      accountNumber,
      amount,
      bankName,
      fullName,
      swiftCode,
    }: withdrawTransactionDTO,
    userId: string,
  ) {
    const findUser = await this.database.user.findUnique({
      where: { id: userId },
    });
    if (!findUser) throw new BadRequestException('User not found');

    try {
      return await this.database.$transaction(
        async (tx) => {
          const newBalance = findUser.balance - amount;
          console.log(amount);
          console.log(findUser.balance);
          console.log(findUser.balance - amount);
          await tx.user.update({
            where: { id: userId },
            data: { balance: newBalance },
          });
          await tx.tranBnakWithdraw.create({
            data: {
              userId,
              accountNumber,
              amount,
              bankName,
              fullName,
              IBAN,
              swiftCode,
            },
          });
          this.logger.log(`transaction successful for userId: ${userId}`);
          return { message: `transaction successful for userId: ${userId}` };
        },
        {
          maxWait: 5000, // default: 2000
          timeout: 10000, // default: 5000
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable, // optional, default defined by database configuration
        },
      );
    } catch (error) {
      this.logger.error(`error: ${error.message}`);
      return { message: `transaction failed for userId: ${userId}` };
    }
  }

  //*****************************************************************************************************************************/

  async transferMoney(
    { amount, receiverId }: TransferMoneyDTO,
    senderId: string,
  ) {
    const sender = await this.database.user.findUnique({
      where: { id: senderId },
    });
    if (!sender) throw new BadRequestException(`Sender not found`);
    const receiver = await this.database.user.findUnique({
      where: { id: receiverId },
    });
    if (!receiver) throw new BadRequestException(`Receiver not found`);
    if (sender.balance < amount)
      throw new BadRequestException(
        'You do not have enough money to transfer it ',
      );

    const MAX_RETRIES = 5;
    let retries = 0;

    while (retries < MAX_RETRIES) {
      try {
        await this.database.$transaction(
          [
            this.database.user.update({
              where: {
                id: senderId,
              },
              data: {
                balance: sender.balance - amount,
              },
            }),
            this.database.user.update({
              where: {
                id: receiverId,
              },
              data: {
                balance: amount,
              },
            }),
            this.database.transaction.create({
              data: {
                amount,
                currency: 'EGP',
                paymentType: 'Inner transfer',
                status: 'Completed',
                success: true,
                type: 'TRANSFER',
                receiverId,
                senderId,
              },
            }),
          ],
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          },
        );
        break;
      } catch (error) {
        if (error.code === 'P2034') {
          retries++;
          continue;
        }
        throw new InternalServerErrorException(error.message);
      }
    }

    return {
      message: `transfer from account id ${senderId} to account id ${receiverId} with amount ${amount} was successfully `,
    };
  }

  //*****************************************************************************************************************************/
  //*****************************************************************************************************************************/
  //*****************************************************************************************************************************/

  private async _hmacCalculation(data: Transaction, hmac: string, ip: any) {
    if (!hmac) throw new UnauthorizedException('this is invalid transaction');
    const obj = data.obj;
    const amount_cents = obj.amount_cents;
    const created_at = obj.created_at;
    const currency = obj.currency;
    const error_occured = obj.error_occured;
    const has_parent_transaction = obj.has_parent_transaction;
    const id = obj.id;
    const integration_id = obj.integration_id;
    const is_3d_secure = obj.is_3d_secure;
    const is_auth = obj.is_auth;
    const is_capture = obj.is_capture;
    const is_refunded = obj.is_refunded;
    const is_standalone_payment = obj.is_standalone_payment;
    const is_voided = obj.is_voided;
    const order_id = obj.order.id;
    const owner = obj.owner;
    const pending = obj.pending;
    const source_data_pan = obj.source_data.pan;
    const source_data_sub_type = obj.source_data.sub_type;
    const source_data_type = obj.source_data.type;
    const success = obj.success;
    const userId = obj.order.shipping_data.email;
    const cartId = obj.order.shipping_data.first_name;
    const key = 'BC267DA5B95B3737C24ADA812DFBEB86';
    const hh =
      amount_cents +
      created_at +
      currency +
      error_occured +
      has_parent_transaction +
      id +
      integration_id +
      is_3d_secure +
      is_auth +
      is_capture +
      is_refunded +
      is_standalone_payment +
      is_voided +
      order_id +
      owner +
      pending +
      source_data_pan +
      source_data_sub_type +
      source_data_type +
      success;

    const hash = crypto.createHmac('sha512', key).update(hh).digest('hex');
    if (hash !== hmac) {
      this.logger.warn(
        `hmac for transaction ID ${id} is wrong and it comming form Ip: ${ip} `,
      );
      throw new InternalServerErrorException();
    }
    return {
      transactionId: id,
      amount: amount_cents,
      success,
      currency,
      source_data_type,
      cartId,
      userId,
    };
  }
}
