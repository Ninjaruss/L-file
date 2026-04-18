import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventsService } from './events.service';
import { Event, EventType } from '../../entities/event.entity';
import { Character } from '../../entities/character.entity';
import { EditLogService } from '../edit-log/edit-log.service';

const mockQueryBuilder = {
  select: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getMany: jest.fn().mockResolvedValue([]),
  getOne: jest.fn().mockResolvedValue(null),
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  addOrderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
};

const mockRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  findByIds: jest.fn().mockResolvedValue([]),
  save: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(() => ({ ...mockQueryBuilder })),
};

const mockEditLog = {
  logCreate: jest.fn().mockResolvedValue(undefined),
  logUpdate: jest.fn().mockResolvedValue(undefined),
  logDelete: jest.fn().mockResolvedValue(undefined),
};

describe('EventsService', () => {
  let service: EventsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: getRepositoryToken(Event), useValue: mockRepo },
        { provide: getRepositoryToken(Character), useValue: mockRepo },
        { provide: EditLogService, useValue: mockEditLog },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('returns paginated result with default page and limit', async () => {
      mockRepo.createQueryBuilder.mockReturnValue({ ...mockQueryBuilder });
      const result = await service.findAll({});
      expect(result).toEqual({ data: [], total: 0, page: 1, totalPages: 0 });
    });

    it('applies arcId filter when provided', async () => {
      const qb = { ...mockQueryBuilder };
      mockRepo.createQueryBuilder.mockReturnValue(qb);
      await service.findAll({ arcId: 3 });
      expect(qb.andWhere).toHaveBeenCalledWith('event.arcId = :arcId', {
        arcId: 3,
      });
    });

    it('applies search filter to title and description', async () => {
      const qb = { ...mockQueryBuilder };
      mockRepo.createQueryBuilder.mockReturnValue(qb);
      await service.findAll({ search: 'tournament' });
      expect(qb.andWhere).toHaveBeenCalledWith(
        '(LOWER(event.title) LIKE LOWER(:search) OR LOWER(event.description) LIKE LOWER(:search))',
        { search: '%tournament%' },
      );
    });

    it('does not apply status filter (no status field)', async () => {
      const qb = { ...mockQueryBuilder };
      mockRepo.createQueryBuilder.mockReturnValue(qb);
      await service.findAll({});
      const calls = qb.andWhere.mock.calls.map((c: unknown[]) => c[0]);
      expect(calls.every((c: unknown) => !String(c).includes('status'))).toBe(
        true,
      );
    });
  });

  describe('create', () => {
    it('saves event without status field', async () => {
      const mockEvent = {
        id: 1,
        title: 'Test',
        chapterNumber: 1,
        type: EventType.DECISION,
      };
      mockRepo.create.mockReturnValue(mockEvent);
      mockRepo.save.mockResolvedValue(mockEvent);

      await service.create(
        { title: 'Test', description: 'long enough desc', chapterNumber: 1 },
        1,
      );

      const createCall = mockRepo.create.mock.calls[0][0];
      expect(createCall).not.toHaveProperty('status');
    });

    it('saves pageNumber when provided', async () => {
      const mockEvent = {
        id: 1,
        title: 'Test',
        chapterNumber: 1,
        pageNumber: 5,
      };
      mockRepo.create.mockReturnValue(mockEvent);
      mockRepo.save.mockResolvedValue(mockEvent);

      await service.create(
        {
          title: 'Test',
          description: 'long enough desc',
          chapterNumber: 1,
          pageNumber: 5,
        },
        1,
      );

      const createCall = mockRepo.create.mock.calls[0][0];
      expect(createCall.pageNumber).toBe(5);
    });
  });

  describe('findOne', () => {
    it('returns null when event does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const result = await service.findOne(999);
      expect(result).toBeNull();
    });
  });

  describe('removed methods', () => {
    it('does not have updateOwnSubmission', () => {
      expect(
        (service as unknown as Record<string, unknown>).updateOwnSubmission,
      ).toBeUndefined();
    });

    it('does not have findByArc', () => {
      expect(
        (service as unknown as Record<string, unknown>).findByArc,
      ).toBeUndefined();
    });

    it('does not have findByGamble', () => {
      expect(
        (service as unknown as Record<string, unknown>).findByGamble,
      ).toBeUndefined();
    });
  });
});
