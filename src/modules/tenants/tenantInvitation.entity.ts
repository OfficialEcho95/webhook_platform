import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';


@Entity('tenant_invitations')
export class TenantInvitationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenantId: number;

  @Column()
  email: string;

  @Column()
  invitedBy: number;

  @Column({ unique: true })
  token: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ default: false })
  accepted: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
