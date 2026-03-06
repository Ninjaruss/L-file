import { Controller, Get, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { EditLogService } from './edit-log.service';
import { EditLogEntityType } from '../../entities/edit-log.entity';

@ApiTags('edit-log')
@Controller('edit-log')
export class EditLogController {
  constructor(private readonly editLogService: EditLogService) {}

  @Get('recent')
  @ApiOperation({ summary: 'Get recent wiki edits (public)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'entityType', required: false, enum: EditLogEntityType })
  @ApiResponse({ status: 200, description: 'Paginated list of recent edits' })
  async getRecent(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('entityType') entityType?: string,
  ) {
    const safeLimit = Math.min(limit, 50);
    const validEntityType = Object.values(EditLogEntityType).includes(entityType as EditLogEntityType)
      ? (entityType as EditLogEntityType)
      : undefined;

    return this.editLogService.getRecent({ page, limit: safeLimit, entityType: validEntityType });
  }

  @Get('submissions')
  @ApiOperation({ summary: 'Get recently approved user submissions (public)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Paginated list of approved submissions' })
  async getRecentSubmissions(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const safeLimit = Math.min(limit, 50);
    return this.editLogService.getRecentApprovedSubmissions({ page, limit: safeLimit });
  }
}
