import { Module, forwardRef } from '@nestjs/common';
import { FamilyMembersService } from './family-members.service';
import { FamilyMembersController } from './family-members.controller';
import { UploadService } from '../upload/upload.service';
import { UsersModule } from '../users/users.module';
import { SharingModule } from '../sharing/sharing.module'; // NOU

@Module({
  imports: [UsersModule, forwardRef(() => SharingModule)], // NOU forwardRef
  controllers: [FamilyMembersController],
  providers: [FamilyMembersService, UploadService],
  exports: [FamilyMembersService],
})
export class FamilyMembersModule { }