import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('event_failures')
export class EventFailure {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  eventId: string;

  @Column()
  tenantId: number;

  @Column()
  eventType: string;

  @Column('json')
  payload: Record<string, any>;

  @Column()
  reason: string;

  @Column({ default: false })
  replayed: boolean;

  @CreateDateColumn()
  failedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  replayedAt?: Date;
}