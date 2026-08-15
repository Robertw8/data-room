import { Test, TestingModule } from '@nestjs/testing';
import { DataRoomsController } from './data-rooms.controller';

describe('DataRoomsController', () => {
  let controller: DataRoomsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DataRoomsController],
    }).compile();

    controller = module.get<DataRoomsController>(DataRoomsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
