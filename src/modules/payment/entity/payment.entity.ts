import { PrimaryGeneratedColumn } from "typeorm";
import { Entity, Column, CreateDateColumn } from "typeorm";
import { TenantPlan } from "../../tenants/tenant.entity";

@Entity('payments')
export class PaymentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenantId: number;

  @Column()
  userId: number;

  @Column()
  reference: string;

  @Column()
  amount: number;

  @Column()
  currency: string;

  @Column()
  plan: TenantPlan;

  @Column({ default: false })
  verified: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
