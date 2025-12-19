import { IsString, Length, Matches, IsOptional, IsEnum } from 'class-validator';
import { TenantPlan } from '../tenant.entity';

export class CreateTenantDto {
  @IsString()
  @Length(2, 50)
  name: string; // official company name

  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be URL-friendly (lowercase letters, numbers, hyphens)',
  })
  slug: string; // subdomain or friendly URL

  @IsOptional()
  @IsEnum(TenantPlan)
  plan?: TenantPlan;

  @IsOptional()
  settings?: Record<string, any>; // custom tenant settings
}