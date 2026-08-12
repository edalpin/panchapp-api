import { Injectable } from '@nestjs/common';
import { User as PrismaUser } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<PrismaUser | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string): Promise<PrismaUser | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findByGoogleSub(googleSub: string): Promise<PrismaUser | null> {
    return this.prisma.user.findUnique({ where: { googleSub } });
  }

  async linkGoogleSub(userId: string, googleSub: string): Promise<PrismaUser | null> {
    const result = await this.prisma.user.updateMany({
      where: { id: userId, googleSub: null },
      data: { googleSub },
    });

    if (result.count === 0) {
      return null;
    }

    return this.prisma.user.findUnique({ where: { id: userId } });
  }
}
