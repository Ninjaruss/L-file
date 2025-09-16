import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseTranslation } from './base-translation.entity';
import { Organization } from '../organization.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('organization_translations')
export class OrganizationTranslation extends BaseTranslation {
  @ApiProperty({
    description: 'Organization this translation belongs to',
    type: () => Organization,
  })
  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @ApiProperty({
    description: 'ID of the organization being translated',
  })
  @Column({ name: 'organization_id' })
  organizationId: number;

  @ApiProperty({
    description: 'Translated name of the organization',
    example: 'アイディアル (IDEAL)',
  })
  @Column({ type: 'text' })
  name: string;

  @ApiPropertyOptional({
    description: 'Translated description of the organization',
  })
  @Column({ type: 'text', nullable: true })
  description: string;
}
