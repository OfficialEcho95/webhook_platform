import { TenantEntity } from "./tenant.entity";
import { Injectable, NotFoundException, BadRequestException, Inject, ForbiddenException } from "@nestjs/common";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { UserEntity } from "../users/user.entity";
import { TenantPlan, TenantStatus } from "./tenant.entity";
import { CreateTenantDto } from "./dto/create-tenant.dto";
import { TenantInvitationEntity } from "./tenantInvitation.entity";
import { randomUUID } from 'crypto';
import { PaystackWebhookHandler } from "../payment/service/paystack.webhook";
import { EventService } from "../events/event.service";
import { UserService } from "../users/user.service";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { QueueTenant } from "../shared/background_runners/queues/tenant.queue";
import { ApiKeyService } from "../api-keys/api-key.service";

/* 
* NTS: for complete atomicity use datasource transactions but for
* now we will keep it simple and just use repository methods with the 
* understanding that in a production environment, we would need to 
* handle potential failures and rollbacks more robustly.
*/
@Injectable()
export class TenantService {
    constructor(
        private readonly eventService: EventService,
        private readonly userService: UserService,
        // private readonly paystackWebhookHandler: PaystackWebhookHandler,
        private eventEmitter: EventEmitter2,
        private readonly queueTenant: QueueTenant,
        private readonly apikey: ApiKeyService,
        @InjectRepository(TenantEntity) private tenantRepository: Repository<TenantEntity>,
        @InjectRepository(UserEntity) private userRepository: Repository<UserEntity>,
        @InjectRepository(TenantInvitationEntity) private tenantInvitationRepository: Repository<TenantInvitationEntity>,
    ) { }


    async createTenant(createTenantDto: CreateTenantDto, ownerId: number) {
        const tenantExists = await this.tenantRepository.findOne({ where: { name: createTenantDto.name } });
        if (tenantExists) {
            throw new BadRequestException('Tenant with this name already exists');
        }

        const ownerExists = await this.userRepository.findOne({
            where: { id: ownerId },
            relations: ['tenants']
        });

        if (!ownerExists) {
            throw new NotFoundException('User not found');
        }

        // 2. Creation Logic
        const newTenant = this.tenantRepository.create({
            ...createTenantDto,
            plan: TenantPlan.FREE,
            status: TenantStatus.ACTIVE,
            ownerId,
            users: [ownerExists] // Add owner as first member
        });

        const savedTenant = await this.tenantRepository.save(newTenant);

        // 3. User Context Update
        await this.userService.setCurrentTenant(ownerId, savedTenant.id);
        await this.apikey.createTestAPIkey(savedTenant.id);


        // Announce the Tenant Creation
        this.eventEmitter.emit('tenant.created', {
            tenantId: savedTenant.id,
            name: savedTenant.name,
            ownerId: ownerId,
            occurredAt: new Date(),
        });


        // Announce the User Addition (The owner is the first user)
        this.eventEmitter.emit('tenant.user_added', {
            tenantId: savedTenant.id,
            userId: ownerId,
            occurredAt: new Date(),
        });

        // 5. Audit Logging
        await this.eventService.logEvent(savedTenant.id, 'TENANT.CREATED', { name: savedTenant.name }, ownerId);

        // 6. Queue Background Tasks (e.g., onboarding emails, analytics setup)
        const queuedTenantCreation = await this.queueTenant.queueTenantCreation(
            savedTenant.id, ownerId, 'emmanuelchukwu1968@gmail.com',
            'Your company tenant has been successfully created. Welcome aboard!'
        );
        console.log('Tenant creation event queued:', queuedTenantCreation);
        return savedTenant;
    }

    async addUserToTenant(tenantId: number, userId: number) {
        const tenant = await this.tenantRepository.findOne({
            where: { id: tenantId },
            relations: ['users'],
        });

        if (!tenant) {
            throw new NotFoundException('Tenant not found');
        }

        if (tenant.plan === TenantPlan.FREE) {
            throw new BadRequestException('Cannot add users to a FREE plan tenant');
        }

        const user = await this.userRepository.findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const isAlreadyMember = tenant.users.some(
            (member) => member.id === user.id,
        );

        if (isAlreadyMember) {
            throw new BadRequestException('User is already a member of this tenant');
        }

        tenant.users.push(user);

        await this.tenantRepository.save(tenant);

        // update users curent tenant
        await this.userService.setCurrentTenant(userId, tenantId)

        await this.eventService.logEvent(tenantId, 'TENANT.USER_ADDED', { userId: user.id }, tenant.ownerId);

        return {
            message: 'User successfully added to tenant',
        };
    }

    async checkTenantPlan(tenantId: number) {
        const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
        if (!tenant) {
            throw new NotFoundException('Tenant not found');
        }
        return tenant.plan
    }

    isSubscriptionActive(tenant: TenantEntity): boolean {
        if (!tenant.subscriptionExpiry)
            return false;
        return tenant.subscriptionExpiry.getTime() > Date.now();
    }

    async findMembersOfTenant(tenantId: number) {
        const tenant = await this.tenantRepository.findOne({ where: { id: tenantId }, relations: ['users'] });
        if (!tenant) {
            throw new NotFoundException('Tenant not found');
        }
        return tenant.users;
    }

    async findTenantById(id: number) {
        const tenant = await this.tenantRepository.findOne({ where: { id } });
        if (!tenant) {
            throw new NotFoundException('Tenant not found');
        }
        return tenant;
    }

    async findByUuid(uuid: string): Promise<TenantEntity> {
        const tenant = await this.tenantRepository.findOne({
            where: { uuid },
        });

        if (!tenant) {
            throw new NotFoundException('Tenant not found');
        }

        return tenant;
    }

    async findBySlug(slug: string): Promise<TenantEntity> {
        const tenant = await this.tenantRepository.findOne({
            where: { slug },
        });

        if (!tenant) {
            throw new NotFoundException('Tenant not found');
        }

        return tenant;
    }

    async removeUserFromTenant(tenantId: number, userId: number) {
        const tenant = await this.tenantRepository.findOne({
            where: { id: tenantId },
            relations: ['users'],
        });
        if (!tenant) {
            throw new NotFoundException('Tenant not found');
        }
        // Prevent owner removal
        if (tenant.ownerId === userId) {
            throw new BadRequestException(
                'Tenant owner cannot be removed',
            );
        }
        const isMember = tenant.users.some((user) => user.id === userId);
        if (!isMember) {
            throw new BadRequestException('User is not a member of this tenant');
        }
        tenant.users = tenant.users.filter((user) => user.id !== userId);
        await this.tenantRepository.save(tenant);

        // update users curent tenant to null if they are removed from their current tenant
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        if (user.currentTenantId === tenantId) {
            await this.userService.setCurrentTenant(userId, null);
        }

        await this.eventService.logEvent(tenantId, 'TENANT.USER_REMOVED', { userId }, tenant.ownerId);
        return {
            message: 'User successfully removed from tenant',
        };
    }

    // the controller for this method is in the tenant subscription file
    async upgradeTenantPlan(tenantId: number, newPlan: TenantPlan): Promise<{ message: string, updatedPlan: TenantEntity }> {
        const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
        if (!tenant) {
            throw new NotFoundException('Tenant not found');
        }
        if (tenant.plan === newPlan) {
            throw new BadRequestException('Tenant is already on this plan');
        }
        if (tenant.plan === TenantPlan.ENTERPRISE ||
            (tenant.plan === TenantPlan.PRO && newPlan === TenantPlan.FREE)) {
            throw new BadRequestException('Cannot downgrade from PRO or ENTERPRISE to FREE plan');
        }
        tenant.plan = newPlan;
        const now = new Date();

        tenant.subscriptionDate = now;

        tenant.subscriptionExpiry = new Date(now);
        tenant.subscriptionExpiry.setFullYear(
            tenant.subscriptionExpiry.getFullYear() + 1,
        );
        // api key creation will be added here upon successful payment verification
        await this.apikey.createApiKey(tenant.id, `API key for ${newPlan} plan`);
        const updatedPlan = await this.tenantRepository.save(tenant);
        return { message: "Tenant plan successfully upgraded", updatedPlan };
    }

    async downgradeTenantPlan(
        tenantId: number,
        newPlan: TenantPlan,
    ): Promise<{ message: string; newPlan: TenantPlan }> {

        const tenant = await this.tenantRepository.findOne({
            where: { id: tenantId },
            relations: ['apiKeys'],
        });

        if (!tenant) throw new NotFoundException('Tenant not found');

        // To prevent invalid downgrades
        if (tenant.plan === TenantPlan.FREE) {
            throw new BadRequestException('Tenant is already on FREE plan');
        }

        // If subscription already expired → force downgrade
        const isActive = this.isSubscriptionActive(tenant);

        if (!isActive || newPlan === TenantPlan.FREE) {
            tenant.plan = TenantPlan.FREE;

            // revoke all keys
            if (tenant.apiKeys?.length) {
                await this.apikey.revokeApiKey(tenant.apiKeys);
            }

            tenant.subscriptionDate = null;
            tenant.subscriptionExpiry = null;
        } else {
            tenant.plan = newPlan;
        }

        await this.tenantRepository.save(tenant);

        return {
            message: 'Tenant plan successfully downgraded',
            newPlan: tenant.plan,
        };
    }

    async deleteTenant(tenantId: number): Promise<{ message: string }> {
        const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
        if (!tenant) {
            throw new NotFoundException('Tenant not found');
        }
        await this.tenantRepository.remove(tenant);
        return { message: "Tenant successfully deleted" };
    }

    async inviteUserToTenant(tenantId: number, email: string, invitedBy: number) {
        const tenant = await this.tenantRepository.findOne({
            where: { id: tenantId },
            relations: ['users',]
        });
        if (!tenant) {
            throw new NotFoundException('Tenant not found');
        }
        if (tenant.plan === TenantPlan.FREE) {
            throw new BadRequestException('Cannot add users to a FREE plan tenant');
        }
        const inviterIsAMember = tenant.users.some((user) => user.id === invitedBy);
        if (!inviterIsAMember) {
            throw new BadRequestException('You do not have permission to invite users to this tenant');
        }
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
            throw new NotFoundException('User with this email does not exist');
        }
        const isAlreadyMember = tenant.users.some((member) => member.id === user.id);
        if (isAlreadyMember) {
            throw new BadRequestException(`${user.firstname} ${user.lastname} is already a member of this tenant`);
        }
        const existingInvitation = await this.tenantInvitationRepository.findOne({ where: { tenantId, email, accepted: false } });
        if (existingInvitation) {
            throw new BadRequestException('An invitation has already been sent to this email for this tenant');
        }
        const token = randomUUID();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        const invitation = this.tenantInvitationRepository.create({
            tenantId,
            email,
            invitedBy,
            token,
            expiresAt,
            accepted: false,
        });
        await this.tenantInvitationRepository.save(invitation);
        // invitation email sending logic would be added here
        return { message: `Invitation sent successfully to ${email}` };
    }

    async acceptTenantInvitation(token: string, userId: number): Promise<{ message: string }> {
        const invitation = await this.tenantInvitationRepository.findOne({ where: { token, accepted: false } });
        if (!invitation) {
            throw new NotFoundException('Invitation not found');
        }
        if (invitation.expiresAt < new Date()) {
            throw new BadRequestException('Invitation has expired');
        }

        if (invitation.accepted) {
            throw new BadRequestException('Invitation has already been accepted');
        }
        const tenant = await this.tenantRepository.findOne({ where: { id: invitation.tenantId }, relations: ['users'] });
        if (!tenant) {
            throw new NotFoundException('Tenant not found');
        }
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        if (invitation.email !== user.email) {
            throw new ForbiddenException('Invitation does not belong to this user');
        }
        await this.addUserToTenant(tenant.id, user.id);
        invitation.accepted = true;
        await this.tenantInvitationRepository.save(invitation);
        return {
            message: `Invitation accepted successfully and ${user.firstname} ${user.lastname} is now a member of ${tenant.name}`
        };
    }

    rotateWebhookSecret(tenantId: number) { }
    getTenantActivity(tenantId: number) { /*tenant event logs would be implemented here */ }
}