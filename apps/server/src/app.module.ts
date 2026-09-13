import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FamilyMembersModule } from './family-members/family-members.module';
import { SharingModule } from 'src/sharing/sharing.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, FamilyMembersModule, SharingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }