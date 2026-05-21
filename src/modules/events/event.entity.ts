import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('events')
export class EventEntity {
  @PrimaryColumn()
  id: string; // UUID

  @Column()
  tenantId: number;

  @Column({ nullable: true })
  actorId?: number;

  @Column()
  eventType: string;

  @Column('json')
  payload: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
