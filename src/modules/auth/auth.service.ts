import { UserEntity } from "../../modules/users/user.entity";
import { JwtService } from "@nestjs/jwt";
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from "./dto/create-user.dto";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from 'bcrypt';
import { LoginDto } from "./dto/login.dto";
import { UserService } from "../users/user.service";
import { ResetPasswordDto } from "./dto/reset-password.dto";

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
        private readonly userService: UserService,
    ) { }

    async createUser(createUserDTO: CreateUserDto) {
        const existingUser = await this.userRepository.findOne({ where: { email: createUserDTO.email } });
        if (existingUser) {
            throw new BadRequestException('Email already in use');
        }
        const newUser = this.userRepository.create({
            ...createUserDTO, isVerified: false, currentTenantId: undefined
        });

        const savedUser = await this.userRepository.save(newUser);

        const token = await this.jwtService.signAsync({ sub: savedUser.id }, {
            secret: this.configService.get('JWT_SECRET'),
            expiresIn: '1h',
        });

        const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
        const verificationLink = `${frontendUrl}/verify-email?token=${token}`;

        // email sending logic would be ended here later

        const { password, ...safeUser } = savedUser;
        return safeUser;
    }


    async login(loginDTO: LoginDto) {
        const { login } = loginDTO;
        const isEmail = login.includes('@');
        const user = isEmail ? await this.userService.findByEmail(login) : await this.userService.findByPhone(Number(login));

        if (!user) {
            throw new NotFoundException('User not found');
        }
        const isPasswordValid = await bcrypt.compare(loginDTO.password, user.password);
        if (!isPasswordValid) {
            throw new BadRequestException('Invalid credentials');
        }
        const payload = { sub: user.id, email: user.email, role: user.role, tenantId: loginDTO.currentTenantId ?? null };
        const token = await this.jwtService.signAsync(payload);

        const { password: pwd, ...userWithoutPassword } = user;

        return {
            user: userWithoutPassword,
            access_token: token
        };
    }


    async verifyEmail(token: string) {
        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get('JWT_SECRET'),
            });
            const user = await this.userRepository.findOne({ where: { id: payload.sub } });
            if (!user) {
                throw new NotFoundException('User not found');
            }
            user.isVerified = true;
            await this.userRepository.save(user);
            return { message: 'Email verified successfully' };
        } catch (error) {
            throw new BadRequestException('Invalid or expired token');
        }
    }

    async resetPassword(dto: ResetPasswordDto) {
        try {
            const payload = await this.jwtService.verifyAsync(dto.token, {
                secret: this.configService.get('JWT_SECRET'),
            });

            const user = await this.userRepository.findOne({
                where: { id: payload.sub },
            });

            if (!user) {
                throw new NotFoundException('User not found');
            }

            user.password = dto.newPassword;
            await this.userRepository.save(user);

            return { message: 'Password successfully changed' };
        } catch {
            throw new BadRequestException('Invalid or expired token');
        }
    }
}