import {
  Column, Entity, ManyToOne, PrimaryGeneratedColumn, CreateDateColumn,
  UpdateDateColumn, BeforeInsert, OneToMany, ManyToMany
} from "typeorm";
import { TenantEntity } from "../tenants/tenant.entity";
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin'
}

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstname: string;

  @Column()
  lastname: string;

  // Public UUID
  @Column({ type: 'uuid', unique: true })
  uuid: string = uuidv4();

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  phone: number;

  @Column()
  password: string;

  // User can own multiple tenants (proprietor)
  @OneToMany(() => TenantEntity, (tenant) => tenant.owner)
  ownedTenants: TenantEntity[];

  // User can be a member of many tenants (team member)
  @ManyToMany(() => TenantEntity, (tenant) => tenant.users)
  tenants: TenantEntity[];

  @Column({ type: 'enum', enum: UserRole, default: 'customer' })
  role: UserRole;

  @Column({ nullable: true })
  currentTenantId?: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }
}
