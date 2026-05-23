import {
    BadRequestException, CallHandler,
    ExecutionContext, Injectable, NestInterceptor
} from "@nestjs/common";
import { RedisServer } from "redisServer";
import { TenantPlan } from "../../../modules/tenants/tenant.entity";

const PLAN_LIMITS = {
    [TenantPlan.FREE]: 4,         // test/free limit
    [TenantPlan.PRO]: 5000,       // Professional limit
    [TenantPlan.ENTERPRISE]: -1,  // -1 represents "Unlimited"
};

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
    constructor(private readonly redis: RedisServer) { }

    async intercept(context: ExecutionContext, next: CallHandler) {
        const req = context.switchToHttp().getRequest();

        const ctx = req.context; // from guard
        const apiKeyId = ctx.apiKey.id;
        const plan = ctx.plan;

        const limit = PLAN_LIMITS[plan];

        if (limit !== -1) {
            await this.check(apiKeyId, limit);
        }

        return next.handle();
    }

    private async check(apiKeyId: number, limit: number) {
        const redis = this.redis.getConnection();

        const today = new Date().toISOString().split('T')[0];
        const key = `ratelimit:${today}:${apiKeyId}`;

        const usage = await redis.incr(key);

        if (usage === 1) {
            await redis.expire(key, 86400);
        }

        if (usage > limit) {
            throw new BadRequestException('Rate limit exceeded');
        }
    }
}
