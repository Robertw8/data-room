import { Test, TestingModule } from '@nestjs/testing';
import { DataRoomsService } from './data-rooms.service';

describe('DataRoomsService', () => {
  let service: DataRoomsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DataRoomsService],
    }).compile();

    service = module.get<DataRoomsService>(DataRoomsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
