import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly client: PrismaClient;

  get user() {
    return this.client.user;
  }

  get role() {
    return this.client.role;
  }

  get userRole() {
    return this.client.userRole;
  }

  get permission() {
    return this.client.permission;
  }

  get rolePermission() {
    return this.client.rolePermission;
  }

  get post() {
    return this.client.post;
  }

  get $transaction() {
    return this.client.$transaction.bind(this.client);
  }

  constructor() {
    const url = process.env.DATABASE_URL;

    if (!url || url.trim() === '') {
      throw new Error(
        '❌ [Prisma] DATABASE_URL chưa được cấu hình trong file .env!',
      );
    }

    this.client = new PrismaClient({
      adapter: new PrismaPg({ connectionString: url }),
    });
  }

  async onModuleInit() {
    await this.client.$connect();
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}
