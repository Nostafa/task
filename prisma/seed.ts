import { PrismaClient, Prisma } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt();
  return await bcrypt.hash(password, salt);
};
const password = hashPassword('test@121example');
console.log(password);
// const password = await hashPassword('test@121example');
// // : Prisma.UserCreateInput

export const createRandomUser = (): Prisma.UserCreateInput => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  return {
    fullName: faker.person.fullName({ firstName, lastName }),
    password: '$2b$10$Ca4cXl5QjsmgxDY13GHsYe27h5RwYNq98x.KIdQridGSqofuFNDzG',
    phoneNumber: `01122334${faker.number.int({ min: 100, max: 999 })}`,
    email: faker.internet.email({ firstName, lastName }),
  };
};
export const User: any[] = faker.helpers.multiple(createRandomUser, {
  count: 30,
});

async function main() {
  await prisma.user.deleteMany({}); // use with caution.
  await prisma.user.createMany({
    data: User,
    skipDuplicates: true,
  }); // use with caution.
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
