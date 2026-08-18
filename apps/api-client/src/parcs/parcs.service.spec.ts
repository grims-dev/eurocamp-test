import { Test, TestingModule } from '@nestjs/testing';
import { ParcsService } from './parcs.service';

describe('ParcsService', () => {
  let service: ParcsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ParcsService],
    }).compile();

    service = module.get<ParcsService>(ParcsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
