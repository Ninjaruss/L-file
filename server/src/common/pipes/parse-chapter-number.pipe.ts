import {
  PipeTransform,
  Injectable,
  BadRequestException,
  ArgumentMetadata,
} from '@nestjs/common';

/** Matches chapter.number column: numeric(5,1) — integers or one decimal place. */
const CHAPTER_NUMBER_PATTERN = /^\d+(\.\d)?$/;

function parseChapterNumber(value: string): number {
  if (value == null || value === '') {
    throw new BadRequestException('Chapter number is required');
  }
  if (!CHAPTER_NUMBER_PATTERN.test(value)) {
    throw new BadRequestException('Invalid chapter number');
  }
  const num = parseFloat(value);
  if (isNaN(num) || num <= 0) {
    throw new BadRequestException('Invalid chapter number');
  }
  return num;
}

@Injectable()
export class ParseChapterNumberPipe implements PipeTransform<string, number> {
  transform(value: string, _metadata: ArgumentMetadata): number {
    return parseChapterNumber(value);
  }
}

@Injectable()
export class ParseChapterNumberOptionalPipe implements PipeTransform<
  string | undefined,
  number | undefined
> {
  transform(
    value: string | undefined,
    _metadata: ArgumentMetadata,
  ): number | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    return parseChapterNumber(value);
  }
}
