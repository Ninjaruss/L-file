import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ContributionsService } from './contributions.service';

@ApiTags('contributions')
@Controller('contributions')
export class ContributionsController {
  constructor(private readonly contributionsService: ContributionsService) {}

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Get user contribution summary',
    description:
      'Retrieves a summary of all contributions made by a user, including guides, media, annotations, and edits.',
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiOkResponse({ description: 'Contributions summary retrieved successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async getUserContributions(@Param('userId', ParseIntPipe) userId: number) {
    return await this.contributionsService.getUserContributions(userId);
  }

  @Get('user/:userId/count')
  @ApiOperation({
    summary: 'Get total contribution count for a user',
    description: 'Returns the total number of contributions made by a user.',
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiOkResponse({ description: 'Contribution count retrieved successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async getTotalContributionCount(
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    const count =
      await this.contributionsService.getTotalContributionCount(userId);
    return { count };
  }

  @Get('user/:userId/details')
  @ApiOperation({
    summary: 'Get detailed contribution list for a user',
    description:
      'Retrieves detailed lists of guides, media, and annotations submitted by a user.',
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiOkResponse({
    description: 'Contribution details retrieved successfully',
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  async getUserContributionDetails(
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return await this.contributionsService.getUserContributionDetails(userId);
  }
}
