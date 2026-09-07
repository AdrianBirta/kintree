import { Module } from '@nestjs/common';
import { FamilyMembersService } from './family-members.service';
import { FamilyMembersController } from './family-members.controller';
import { UploadService } from '../upload/upload.service';
import { UsersModule } from '../users/users.module'; // NOU

@Module({
  imports: [UsersModule], // NOU
  controllers: [FamilyMembersController],
  providers: [FamilyMembersService, UploadService],
})
export class FamilyMembersModule { }