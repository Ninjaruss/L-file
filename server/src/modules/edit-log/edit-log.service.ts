import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  EditLog,
  EditLogEntityType,
  EditLogAction,
} from '../../entities/edit-log.entity';

@Injectable()
export class EditLogService {
  constructor(
    @InjectRepository(EditLog)
    private editLogRepository: Repository<EditLog>,
  ) {}

  async logEdit(
    entityType: EditLogEntityType,
    entityId: number,
    action: EditLogAction,
    userId: number,
    changedFields?: string[],
  ): Promise<EditLog> {
    const editLog = this.editLogRepository.create({
      entityType,
      entityId,
      action,
      userId,
      changedFields: changedFields || null,
    });
    return await this.editLogRepository.save(editLog);
  }

  async logCreate(
    entityType: EditLogEntityType,
    entityId: number,
    userId: number,
  ): Promise<EditLog> {
    return this.logEdit(entityType, entityId, EditLogAction.CREATE, userId);
  }

  async logUpdate(
    entityType: EditLogEntityType,
    entityId: number,
    userId: number,
    changedFields: string[],
  ): Promise<EditLog> {
    return this.logEdit(
      entityType,
      entityId,
      EditLogAction.UPDATE,
      userId,
      changedFields,
    );
  }

  async logDelete(
    entityType: EditLogEntityType,
    entityId: number,
    userId: number,
  ): Promise<EditLog> {
    return this.logEdit(entityType, entityId, EditLogAction.DELETE, userId);
  }

  async getEditsByUser(userId: number): Promise<EditLog[]> {
    return await this.editLogRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getEditsByEntity(
    entityType: EditLogEntityType,
    entityId: number,
  ): Promise<EditLog[]> {
    return await this.editLogRepository.find({
      where: { entityType, entityId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getEditCountByUser(userId: number): Promise<number> {
    return await this.editLogRepository.count({
      where: { userId },
    });
  }

  async getEditCountByUserGrouped(
    userId: number,
  ): Promise<Record<EditLogEntityType, number>> {
    const results = await this.editLogRepository
      .createQueryBuilder('editLog')
      .select('editLog.entityType', 'entityType')
      .addSelect('COUNT(*)', 'count')
      .where('editLog.userId = :userId', { userId })
      .groupBy('editLog.entityType')
      .getRawMany();

    const counts: Record<EditLogEntityType, number> = {
      [EditLogEntityType.CHARACTER]: 0,
      [EditLogEntityType.GAMBLE]: 0,
      [EditLogEntityType.ARC]: 0,
      [EditLogEntityType.ORGANIZATION]: 0,
      [EditLogEntityType.EVENT]: 0,
    };

    for (const result of results) {
      counts[result.entityType as EditLogEntityType] = parseInt(
        result.count,
        10,
      );
    }

    return counts;
  }
}
