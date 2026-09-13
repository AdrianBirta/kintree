import { Module, forwardRef } from '@nestjs/common';
import { SharingService } from './sharing.service';
import { SharingController } from './sharing.controller';
import { PublicShareController } from './public-share.controller';
import { UsersModule } from '../users/users.module';
import { FamilyMembersModule } from '../family-members/family-members.module';

@Module({
  imports: [UsersModule, forwardRef(() => FamilyMembersModule)], // NOU forwardRef
  controllers: [SharingController, PublicShareController],
  providers: [SharingService],
  exports: [SharingService], // NOU — necesar pentru FamilyMembersController
})
export class SharingModule { }