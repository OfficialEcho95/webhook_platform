import { UserEntity } from "./user.entity";
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>
    ) { }

    findByEmail(email: string) {
        return this.userRepository.findOne({ where: { email } });
    }

    findByPhone(phone: string) {
        return this.userRepository.findOne({ where: { phone } });
    }

    async findById(id: number): Promise<UserEntity | null> {
        return this.userRepository.findOne({ where: { id } });
    }

    //updates user entity to set the current tenant when tenant is created or when user is added to a tenant
    async setCurrentTenant(userId: number, tenantId: number | null) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['tenants'],
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Only check membership if tenantId is a number 
        if (tenantId !== null) {
            const isMember = user.tenants.some((tenant) => tenant.id === tenantId);

            if (!isMember) {
                throw new ForbiddenException(
                    'User does not belong to this tenant',
                );
            }
        }

        user.currentTenantId = tenantId;
        await this.userRepository.save(user);
    }

}