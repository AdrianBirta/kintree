import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FamilyMembersModule } from './family-members/family-members.module';
import { SharingModule } from 'src/sharing/sharing.module';
import { InvitesModule } from 'src/invites/invites.module';
import { MessagingModule } from 'src/messaging/messaging.module';
import { DonationsModule } from './donations/donations.module';
import { MailModule } from './mail/mail.module'; // NOU

@Module({
  imports: [
    PrismaModule,
    MailModule, // NOU (global: MailService e disponibil oriunde)
    AuthModule,
    UsersModule,
    FamilyMembersModule,
    SharingModule,
    InvitesModule,
    MessagingModule,
    DonationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }