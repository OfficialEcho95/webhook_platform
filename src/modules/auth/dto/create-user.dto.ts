import { IsString, IsEmail, IsNumber, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole } from '../../users/user.entity';


export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  firstname: string;

  @IsString()
  @IsNotEmpty()
  lastname: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  // @IsString()
  // currentTenantId: string; // tenant the user belongs to

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole; // defaults to CUSTOMER
}