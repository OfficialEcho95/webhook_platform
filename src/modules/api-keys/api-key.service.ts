import { Injectable, Logger, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ApiKey } from './api-key.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'crypto';
import { RedisServer } from 'redisServer';
import { TenantPlan } from '../tenants/tenant.entity';


const PLAN_LIMITS = {
  [TenantPlan.FREE]: 4,         // test/free limit
  [TenantPlan.PRO]: 5000,       // Professional limit
  [TenantPlan.ENTERPRISE]: -1,  // -1 represents "Unlimited"
};

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
      description: 'Test API Key (Limited to 4/day)',
      active: true,
    });

    const savedKey = await this.apiKeyRepo.save(key);
    return { apiKey: savedKey, rawKey };
  }

  /**
   * This is the method that guards all API requests. 
   * It validates the key and checks the rate limit based on the tenant's plan.
   */
  async validateAndCheckLimit(rawKey: string): Promise<ApiKey> {
    const hashedKey = this.hashKey(rawKey);

    // We MUST join the tenantEntity to see what plan they are on
    const apiKey = await this.apiKeyRepo.findOne({
      where: { key: hashedKey, active: true },
      relations: ['tenantEntity'],
    });

    if (!apiKey) throw new UnauthorizedException('Invalid API Key');

    const tenant = apiKey.tenantEntity;
    const dailyLimit = PLAN_LIMITS[tenant.plan] || 0;

    // If the plan is not unlimited (-1), check the Redis counter
    if (dailyLimit !== -1) {
      await this.checkRateLimit(apiKey.id, dailyLimit, tenant.plan);
    }
    return apiKey;
  }

  private async checkRateLimit(apiKeyId: number, limit: number, planName: string) {
    const redis = this.redisServer.getConnection();
    // Key format: ratelimit:2026-03-19:apikey:123
    const today = new Date().toISOString().split('T')[0];
    const redisKey = `ratelimit:${today}:apikey:${apiKeyId}`;

    const currentUsage = await redis.incr(redisKey);

    if (currentUsage === 1) {
      await redis.expire(redisKey, 86400); // 24-hour TTL
    }

    if (currentUsage > limit) {
      this.logger.warn(`Rate limit exceeded for API Key ${apiKeyId} (${planName} Plan)`);
      throw new BadRequestException(
        `Daily limit reached for ${planName} plan (${limit}/${limit} requests used). ` +
        `Upgrade your plan for higher limits.`
      );
    }
  }

  async createApiKey(tenantId: number, description?: string): Promise<ApiKey> {
    const key = randomBytes(32).toString('hex'); // 64-character key

    const apiKey = this.apiKeyRepo.create({
      tenantId,
      key,
      description,
      active: true,
    });

    await this.apiKeyRepo.save(apiKey);
    this.logger.log(`API key created for tenant ${tenantId} ${apiKey.key}`);
    return apiKey;
  }

  async revokeApiKey(apiKeys: ApiKey[]){
    if (apiKeys.length === 0) return;

    const ids = apiKeys.map(k => k.id);
    await this.apiKeyRepo.update(ids, { active: false, revokedAt: new Date()})
      await this.createTestAPIkey(apiKeys[0].tenantId);
  }

  async getTenantKeys(tenantId: number): Promise<ApiKey[]> {
    return this.apiKeyRepo.find({ where: { tenantId } });
  }

  async validateKey(key: string): Promise<ApiKey> {
    const apiKey = await this.apiKeyRepo.findOne({ where: { key, active: true } });
    if (!apiKey) throw new BadRequestException('Invalid or revoked API key');
    return apiKey;
  }
}
