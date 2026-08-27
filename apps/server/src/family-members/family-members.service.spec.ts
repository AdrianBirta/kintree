import { Test, TestingModule } from '@nestjs/testing';
import { FamilyMembersService } from './family-members.service';

describe('FamilyMembersService', () => {
  let service: FamilyMembersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FamilyMembersService],
    }).compile();

    service = module.get<FamilyMembersService>(FamilyMembersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
