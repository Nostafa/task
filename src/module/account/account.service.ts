import { BadRequestException, Injectable } from '@nestjs/common';
import { UpdateAccountDto } from './dto/update-account.dto';
import { DatabaseService } from 'src/shared/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class AccountService {
  constructor(private readonly database: DatabaseService) {}

  async findAll(
    page: string = '1',
    limit: string = '5',
    order: Prisma.SortOrder = 'asc',
  ) {
    const take = +limit;
    const skip = (+page - 1) * take;
    const accountCount = await this.database.user.count();
    const totalPages = Math.ceil(accountCount / take) + 1;
    if (+page > totalPages)
      throw new BadRequestException(`page number:${page} not exist`);
    const accounts = await this.database.user.findMany({
      skip,
      take,
      orderBy: { createdAt: order },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        balance: true,
        currency: true,
      },
    });
    return { data: { accounts, totalPages } };
  }

  async findOne(id: string) {
    const user = await this.database.user.findUnique({ where: { id } });
    return { data: user };
  }

  async update(id: string, updateAccountDto: UpdateAccountDto) {
    const user = await this.database.user.update({
      where: { id },
      data: { ...updateAccountDto },
    });
    return { data: user };
  }

  async remove(id: string) {
    const user = await this.database.user.findUnique({ where: { id } });
    if (!user) throw new BadRequestException(`User not found`);
    await this.database.user.delete({ where: { id } });
    return { message: `This action removes a #${id} account` };
  }
}
