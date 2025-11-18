import { 
    Column, Entity, ManyToOne, PrimaryGeneratedColumn, 
    Unique, CreateDateColumn, UpdateDateColumn
} from "typeorm";
import { TenantEntity } from "../tenants/tenant.entity";

@Entity('users')
@Unique(['email'])
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstname: string;

  @Column()
  lastname: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @ManyToOne(() => TenantEntity, (tenant) => tenant.users, { onDelete: 'CASCADE' })
  tenant: TenantEntity;

  @Column({ default: 'customer' })
  role: 'customer' | 'admin';

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}