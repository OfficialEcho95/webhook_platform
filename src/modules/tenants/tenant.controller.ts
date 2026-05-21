import {
  Controller,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Req,
  Get,
  UseGuards,
  Delete,
} from '@nestjs/common';
import type { Request } from 'express';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { Public } from '../shared/decorators/public.decorators';
import { AuthGuard } from '@nestjs/passport';
import { SkipTenant } from '../shared/decorators/skip-tenant.decorator';

@Controller('tenants')
@UseGuards(AuthGuard('jwt'))

export class TenantController {
  constructor(private readonly tenantService: TenantService) { }

  /**
   * Create a new tenant
   * - Authenticated user becomes the owner
   */
  @Post('create-tenant')
  @SkipTenant() // Skip tenant guard for tenant creation
  async createTenant(
    @Body() createTenantDto: CreateTenantDto,
    @Req() req: Request,
  ) {
    if (!req.user || typeof req.user['id'] === 'undefined') {
      throw new Error('User information is missing from request.');
    }
    const ownerId = req.user['id']; // set by JWT strategy

    return this.tenantService.createTenant(createTenantDto, ownerId);
  }

  /**
   * Add a user to a tenant
   * - Only works for non-FREE plans
   */
  @Post(':tenantId/users/:userId')
  @SkipTenant()
  async addUserToTenant(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.tenantService.addUserToTenant(tenantId, userId);
  }

  @Get('tenant-info/:tenantId')
  @SkipTenant()
  async getTenantInfo(@Param('tenantId', ParseIntPipe) tenantId: number) {
    return this.tenantService.checkTenantPlan(tenantId)
  }


  @Delete(':tenantId/users/:userId')
  @SkipTenant()
  async removeUserFromTenant(@Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('userId', ParseIntPipe) userId: number) {
    return this.tenantService.removeUserFromTenant(tenantId, userId);
  }


  @Delete(':tenantId')
  @SkipTenant()
  async deleteTenant(@Param('tenantId', ParseIntPipe) tenantId: number) {
    return this.tenantService.deleteTenant(tenantId);
  }


  @Post(':tenantId/invite')
  @SkipTenant()
  async inviteUserToTenant(@Param('tenantId', ParseIntPipe) tenantId: number,
    @Body('email') email: string, @Req() req: Request) {
    const user = req.user;
    if (!user || typeof user['id'] === 'undefined') {
      throw new Error('User information is missing from request.');
    }
    const invitedBy = user['id'];
    return this.tenantService.inviteUserToTenant(tenantId, email, invitedBy);
  }

  @Post('accept-invite/:userId/:token')
  @SkipTenant()
  async acceptTenantInvitation(@Param('token') token: string,
    @Param('userId', ParseIntPipe) userId: number) {
    return this.tenantService.acceptTenantInvitation(token, userId);
  }
}