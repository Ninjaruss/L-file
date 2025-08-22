import { IsString, IsOptional, IsUrl, IsEnum, IsNumber } from 'class-validator';

export class CreateMediaDto {
  @IsUrl()
  url: string;

  @IsOptional()
  @IsEnum(['image', 'video', 'audio'])
  type?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  arcId?: number;

  @IsOptional()
  @IsNumber()
  characterId?: number;

  @IsOptional()
  @IsNumber()
  eventId?: number;
}
