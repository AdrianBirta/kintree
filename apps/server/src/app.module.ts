import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FamilyMembersModule } from './family-members/family-members.module';
import { SharingModule } from 'src/sharing/sharing.module';
import { InvitesModule } from 'src/invites/invites.module';
import { MessagingModule } from 'src/messaging/messaging.module'; // ADĂUGAT
import { DonationsModule } from './donations/donations.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    FamilyMembersModule,
    SharingModule,
    InvitesModule, // ADĂUGAT — deși funcționează și doar via AuthModule (e importat acolo), e mai curat să fie explicit aici
    MessagingModule, // ADĂUGAT — asta rezolvă 404-ul
    DonationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }