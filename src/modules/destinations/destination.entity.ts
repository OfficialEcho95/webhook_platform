import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('destinations')
@Index(['tenantId', 'eventType'])
export class Destination {
  @PrimaryGeneratedColumn()
  id: number;

  /* Multi-tenancy */

  @Column()
  tenantId: number;

  /* Subscription */

  @Column()
  eventType: string;

  /* Target */

  @Column()
  url: string;

  @Column({ nullable: true })
  secret?: string;

  @Column({ type: 'json', nullable: true })
  headers?: Record<string, string>;

  /* Retry policy */

  @Column({ default: 3 })
  maxRetries: number;

  @Column({ default: 60 })
  retryDelaySeconds: number;

  /* Control */

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
