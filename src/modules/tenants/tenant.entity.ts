import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { UserEntity } from '../../modules/users/user.entity';
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

  // Public UUID
  @Column({ type: 'uuid', unique: true })
  uuid: string = uuidv4();

  @Column()
  @Index({ unique: true })
  slug: string; // Used for subdomains/workspace URLs

  @Column({
    type: 'enum',
    enum: TenantPlan,
    default: TenantPlan.FREE,
  })
  plan: TenantPlan;

  @Column({
    type: 'enum',
    enum: TenantStatus,
    default: TenantStatus.ACTIVE,
  })
  status: TenantStatus;

  /*
  This is the single user who created or “owns” the tenant.
  Usually, the owner can manage billing, invite/remove users, delete the tenant
  ManyToOne because many tenants can have the same owner, but each tenant has only one owner.
  */
  @ManyToOne(() => UserEntity, (user) => user.ownedTenants, { eager: true })
  owner: UserEntity;

  /*
  This is a list of all members of the tenant, including the owner
  ManyToMany because a user can belong to multiple tenants, and each tenant has multiple users
  */
  @ManyToMany(() => UserEntity, (user) => user.tenants, { cascade: true })
  @JoinTable()
  users: UserEntity[];

  @Column({ nullable: true })
  webhookSecret: string; // used for your platform's webhook signing

  @Column({ type: 'json', nullable: true })
  settings: Record<string, any>; // flexible configuration

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date | null;
}
