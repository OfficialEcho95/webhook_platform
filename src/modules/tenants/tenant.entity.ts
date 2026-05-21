import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { ApiKey } from '../api-keys/api-key.entity';
import { UserEntity } from '../users/user.entity';
import { v4 as uuidv4 } from 'uuid';

export enum TenantPlan {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

export enum TenantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}

@Entity('tenants')
export class TenantEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index({ unique: true })
  name: string;

  // Public, non-guessable identifier (safe for URLs, APIs, etc.)
  @Column({ type: 'uuid', unique: true })
  uuid: string = uuidv4();

  @Column()
  @Index({ unique: true })
  slug: string;

  @Column({
    type: 'enum',
    enum: TenantPlan,
    default: TenantPlan.FREE,
  })
  plan: TenantPlan;

  @Column({ type: 'datetime', nullable: true })
  subscriptionDate: Date | null;

  @Column({ type: 'datetime', nullable: true })
  subscriptionExpiry: Date | null;

  @ManyToOne(() => ApiKey, (apiKey) => apiKey.tenantEntity,
  { eager: true, cascade: true })
  apiKeys: ApiKey[];

  @Column({
    type: 'enum',
    enum: TenantStatus,
    default: TenantStatus.ACTIVE,
  })
  status: TenantStatus;

  /**
   * Tenant owner
   * - One user owns many tenants
   * - Each tenant has exactly one owner
   */
  @ManyToOne(() => UserEntity, (user) => user.ownedTenants, {
    eager: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'ownerId' })
  owner: UserEntity;

  @Column()
  ownerId: number;

  /**
   * Tenant members (including the owner)
   * - Users can belong to multiple tenants
   * - Tenants can have multiple users
   */
  @ManyToMany(() => UserEntity, (user) => user.tenants)
  @JoinTable({    name: 'tenant_users',
    joinColumn: {
      name: 'tenantId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'userId',
      referencedColumnName: 'id',
    },
  })
  users: UserEntity[];

  @Column({ nullable: true })
  webhookSecret?: string;

  @Column({ type: 'json', nullable: true })
  settings?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date | null;
}
