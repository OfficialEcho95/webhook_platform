import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TenantEntity } from '../tenants/tenant.entity';

@Entity('api_keys')
export class ApiKey {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenantId: number;

  @ManyToOne(() => TenantEntity, (tenant) => tenant.apiKeys, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenantId' })
  tenantEntity!: TenantEntity;

  @Column({ unique: true })
  key: string;

  @Column({ default: true })
  active: boolean;

  @Column({ nullable: true })
  description?: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({type: 'datetime', nullable: true })
  revokedAt: Date | null;
}