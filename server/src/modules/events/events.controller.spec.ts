import { Test, TestingModule } from '@nestjs/testing';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { NotFoundException } from '@nestjs/common';

const mockService = {
  findAll: jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, totalPages: 0 }),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  findGroupedByArc: jest.fn().mockResolvedValue({ arcs: [], noArc: [] }),
};

describe('EventsController', () => {
  let controller: EventsController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [{ provide: EventsService, useValue: mockService }],
    }).compile();

    controller = module.get<EventsController>(EventsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAll', () => {
    it('delegates to service.findAll', async () => {
      await controller.getAll({});
      expect(mockService.findAll).toHaveBeenCalledWith({});
    });
  });

  describe('getGroupedByArc', () => {
    it('delegates to service.findGroupedByArc', async () => {
      await controller.getGroupedByArc(undefined, undefined);
      expect(mockService.findGroupedByArc).toHaveBeenCalledWith({
        userProgress: undefined,
        type: undefined,
      });
    });
  });

  describe('getOne', () => {
    it('returns event when found', async () => {
      const event = { id: 1, title: 'Test' };
      mockService.findOne.mockResolvedValue(event);
      const result = await controller.getOne(1);
      expect(result).toEqual(event);
    });

    it('throws NotFoundException when event not found', async () => {
      mockService.findOne.mockResolvedValue(null);
      await expect(controller.getOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('removed endpoints', () => {
    it('does not have an approve method', () => {
      expect((controller as unknown as Record<string, unknown>).approve).toBeUndefined();
    });

    it('does not have a reject method', () => {
      expect((controller as unknown as Record<string, unknown>).reject).toBeUndefined();
    });

    it('does not have updateOwnSubmission method', () => {
      expect((controller as unknown as Record<string, unknown>).updateOwnSubmission).toBeUndefined();
    });

    it('does not have getByArc method', () => {
      expect((controller as unknown as Record<string, unknown>).getByArc).toBeUndefined();
    });
  });
});
