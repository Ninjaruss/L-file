import { BadRequestException } from '@nestjs/common';
import {
  ParseChapterNumberOptionalPipe,
  ParseChapterNumberPipe,
} from './parse-chapter-number.pipe';

describe('ParseChapterNumberPipe', () => {
  const pipe = new ParseChapterNumberPipe();

  it('accepts integer chapter numbers', () => {
    expect(pipe.transform('361', {} as never)).toBe(361);
  });

  it('accepts decimal chapter numbers', () => {
    expect(pipe.transform('361.5', {} as never)).toBe(361.5);
  });

  it('rejects invalid values', () => {
    expect(() => pipe.transform('abc', {} as never)).toThrow(
      BadRequestException,
    );
    expect(() => pipe.transform('361.55', {} as never)).toThrow(
      BadRequestException,
    );
  });
});

describe('ParseChapterNumberOptionalPipe', () => {
  const pipe = new ParseChapterNumberOptionalPipe();

  it('returns undefined for empty values', () => {
    expect(pipe.transform(undefined, {} as never)).toBeUndefined();
    expect(pipe.transform('', {} as never)).toBeUndefined();
  });

  it('parses decimal chapter numbers', () => {
    expect(pipe.transform('20.5', {} as never)).toBe(20.5);
  });
});
