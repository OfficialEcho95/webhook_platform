import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiKeyService } from '../../api-keys/api-key.service';
import { AuthenticatedRequest } from '../decorators/apikey.decorator';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const authHeader = request.headers['authorization'];

    if (!authHeader?.startsWith('ApiKey ')) {
      throw new BadRequestException('API key required');
    }

    const rawKey = authHeader.replace('ApiKey ', '').trim();

    if (!rawKey) {
      throw new BadRequestException('API key missing');
    }

    // Validate + resolve full identity
    const apiKey = await this.apiKeyService.validateKey(rawKey);

    if (!apiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    // 🧠 ATTACH CONTEXT
    request.context = {
      apiKey,
      tenant: apiKey.tenantEntity,
      plan: apiKey.tenantEntity?.plan,
    };

    return true;
  }
}