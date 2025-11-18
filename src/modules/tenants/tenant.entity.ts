import { Column, Entity, OneToMany, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { UserEntity } from "../users/user.entity";

@Entity('tenants')
export class TenantEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => UserEntity, (user) => user.tenant)
  users: UserEntity[];
}