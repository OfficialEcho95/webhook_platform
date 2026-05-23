import { Injectable, Logger, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ApiKey } from './api-key.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'crypto';
import { RedisServer } from 'redisServer';
import { TenantEntity, TenantPlan } from '../tenants/tenant.entity';




/***
* Bear in mind that the monitoring of the subscription duration to enforce key revocation
* upon subscription expiry has not been implemented anywhere. 
* And that is a critical part of the system that needs to be addressed in the future.
*/


@Injectable()
export class ApiKeyService {
  private readonly logger = new Logger(ApiKeyService.name);

  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeyRepo: Repository<ApiKey>,
    private readonly redisServer: RedisServer,
  ) { }

  private hashKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }

  async createTestAPIkey(tenantId: number): Promise<{ apiKey: ApiKey; rawKey: string }> {
    const rawKey = `TEST_${randomBytes(32).toString('hex')}`;
    const hashedKey = this.hashKey(rawKey);

    const key = this.apiKeyRepo.create({
      tenantId,
      key: hashedKey,
      description: 'Test API Key (Limited to 4 requests/day)',
      active: true,
    });

    const savedKey = await this.apiKeyRepo.save(key);
    return { apiKey: savedKey, rawKey };
  }


  /**
   *  This method creates a new API key for a premium registered tenant. 
   */
  async createApiKey(tenantId: number, description?: string): Promise<{ rawKey: string; apiKey: ApiKey }> {
    const rawKey = `sk_live_${randomBytes(32).toString('hex')}`;
    const hashedKey = this.hashKey(rawKey); // 64-character key

    const apiKey = this.apiKeyRepo.create({
      tenantId,
      key: hashedKey,
      description,
      active: true,
    });

    const savedKey = await this.apiKeyRepo.save(apiKey);
    this.logger.log(`API key created for tenant = ${tenantId} ${savedKey.key}`);
    return { rawKey, apiKey: savedKey };
  }

  getPlan(tenant: TenantEntity): TenantPlan {
    return tenant.plan;
  }

  assertTenantActive(apiKey: ApiKey) {
    const tenant = apiKey.tenantEntity;

    if (tenant.status !== 'active') {
      throw new UnauthorizedException('Tenant is inactive');
    }
  }

  /**
   * validation happens in the api key guard
   * rates are enforced in the rate interceptor 
   */
  async validateKey(rawKey: string): Promise<ApiKey> {
    return this.resolveApiKey(rawKey);
  }

  private async resolveApiKey(rawKey: string): Promise<ApiKey> {
    const hashedKey = this.hashKey(rawKey);

    const apiKey = await this.apiKeyRepo.findOne({
      where: {
        key: hashedKey,
        active: true,
      },
      relations: ['tenantEntity'],
    });

    if (!apiKey) {
      throw new UnauthorizedException('Invalid API Key');
    }

    return apiKey;
  }

  async revokeApiKey(apiKeyId: number): Promise<void> {
    const result = await this.apiKeyRepo.update(apiKeyId, {
      active: false,
      revokedAt: new Date(),
    });

    // If no rows were affected, the API key was not found
    if (!result.affected) {
      throw new NotFoundException('API key not found');
    }

    this.logger.log(`Revoked API key: ${apiKeyId}`);
  }

  async revokeTenantKeys(tenantId: number): Promise<void> {
    const result = await this.apiKeyRepo.update(
      { tenantId, active: true },
      {
        active: false,
        revokedAt: new Date(),
      },
    );

    this.logger.warn(`Revoked all API keys for tenant ${tenantId}`);
  }

  async getTenantKeys(tenantId: number): Promise<ApiKey[]> {
    return this.apiKeyRepo.find({ where: { tenantId } });
  }
}
