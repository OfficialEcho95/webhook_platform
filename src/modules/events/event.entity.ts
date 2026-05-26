import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('events')

@Index(['tenantId', 'createdAt'])
@Index(['eventType', 'createdAt'])
@Index(['correlationId'])
@Index(['idempotencyKey'], { unique: true })

export class EventEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  tenantId: number;

  @Column({ nullable: true })
  actorId?: number;

  @Column()
  eventType: string;

  @Column({ default: 1 })
  version: number;

  @Column('json')
  payload: Record<string, any>;

  //Trace entire request chain
  @Column({ nullable: true })
  correlationId?: string;

  // Prevent duplicate event creation (e.g., from retries)
  @Column({ nullable: true, unique: true })
  idempotencyKey?: string;

  // Optional metadata for internal use (e.g., processing hints)
  @Column('json', { nullable: true })
  metadata?: Record<string, any>;

  // Whether fanout completed successfully
  @Column({ default: false })
  fanoutCompleted: boolean;

  @CreateDateColumn()
  createdAt: Date;
}