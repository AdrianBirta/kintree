import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { FamilyMembersModule } from '../family-members/family-members.module';

@Module({
  imports: [FamilyMembersModule], // exportă FamilyMembersService
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule { }