import { IsUrl, IsNotEmpty, IsInt } from 'class-validator';

export class CreateWebhookDto {
  @IsInt()
  @IsNotEmpty()
  tenantId: number;

  @IsUrl({}, { message: 'A valid target URL is required' })
  @IsNotEmpty()
  targetUrl: string;
}