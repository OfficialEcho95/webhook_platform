import { Request } from 'express';
import { ApiKey } from '../../../modules/api-keys/api-key.entity';
import { TenantEntity, TenantPlan } from '../../../modules/tenants/tenant.entity';

export interface AuthenticatedRequest extends Request {
  context?: RequestContext;
}

export type RequestContext = {
  apiKey: ApiKey;
  tenant: TenantEntity;
  plan: TenantPlan;
};