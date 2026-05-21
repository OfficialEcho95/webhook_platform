import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TenantModule } from '../tenants/tenant.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([UserEntity]),
        forwardRef(() => TenantModule),
    ],
    providers: [UserService],
    controllers: [UserController],
    exports: [UserService], // 🔑 REQUIRED for AuthModule
})
export class UserModule { } 
