import { PartialType } from '@nestjs/swagger';
import { CreateProfileImageDto } from './create-profile-image.dto';

export class UpdateProfileImageDto extends PartialType(CreateProfileImageDto) {}
