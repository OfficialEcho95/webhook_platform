import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { JwtStrategy } from "../shared/guards/jwt.strategy";
import { AuthService } from "./auth.service";
import { UserModule } from "../users/user.module";
import { AuthController } from "./auth.controller";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserEntity } from "../users/user.entity";
import { UserService } from "../users/user.service";
import { QueueAuthentication } from "../shared/background_runners/queues/authentication.queue";
import { RedisServer } from "redisServer";


@Module({ 
    imports: [
        PassportModule,
        TypeOrmModule.forFeature([UserEntity]),
        ConfigModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: '6h' },
            })
        }),
        UserModule
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, UserService, QueueAuthentication, RedisServer],
    exports: [AuthService, UserService]
})

export class AuthModule { }