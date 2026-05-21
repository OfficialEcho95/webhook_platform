import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { EventEntity } from '../events/event.entity';
import { Destination } from '../destinations/destination.entity';

export enum DeliveryStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  RETRYING = 'retrying',
}

@Entity('deliveries')
@Index(['eventId', 'destinationId'])
export class Delivery {
  @PrimaryGeneratedColumn()
  id: number;

  /* Event (UUID) */

  @Column()
  eventId: string;

  @ManyToOne(() => EventEntity, {onDelete: 'CASCADE',}) event: EventEntity;

  /* Destination */

  @Column()
  destinationId: number;

  @ManyToOne(() => Destination, {
    onDelete: 'CASCADE',
  })
  destination: Destination;

  /* Execution state */

  @Column({
    type: 'enum',
    enum: DeliveryStatus,
    default: DeliveryStatus.PENDING,
  })
  status: DeliveryStatus;

  @Column({ default: 0 })
  attemptCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastAttemptAt?: Date;

  /* Response snapshot */

  @Column({ nullable: true })
  responseStatus?: number;

  @Column({ type: 'text', nullable: true })
  responseBody?: string;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
