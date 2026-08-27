import { Module } from '@nestjs/common';
import { FamilyMembersService } from './family-members.service';
import { FamilyMembersController } from './family-members.controller';

@Module({
  controllers: [FamilyMembersController],
  providers: [FamilyMembersService],
})
export class FamilyMembersModule {}
