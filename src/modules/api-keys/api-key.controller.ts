import { Controller, Post, Delete, Get, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ApiKeyService } from './api-key.service';
import { ApiKey } from './api-key.entity';

@Controller('api-keys')
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  // Create a new API key
  @Post()
  async createKey(@Body('tenantId') tenantId: number, @Body('description') description?: string) {
    return this.apiKeyService.createApiKey(tenantId, description);
  }

  // Revoke a key
  @Delete(':id')
  async revokeKey(@Param('id', ParseIntPipe) id: number) {
    return this.apiKeyService.revokeApiKey(ApiKey[id]);
  }

  // List tenant keys
  @Get(':tenantId')
  async listKeys(@Param('tenantId', ParseIntPipe) tenantId: number) {
    return this.apiKeyService.getTenantKeys(tenantId);
  }
}
