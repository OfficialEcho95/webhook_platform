import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import { ApiKeyService } from '../../api-keys/api-key.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    if (!authHeader?.startsWith('ApiKey ')) throw new BadRequestException('API key required');

    const key = authHeader.replace('ApiKey ', '');
    await this.apiKeyService.validateKey(key);

    return true;
  }
}
