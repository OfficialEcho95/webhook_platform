import { Controller } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { Post, Body } from '@nestjs/common';
import { LoginDto } from "./dto/login.dto";
import { CreateUserDto } from "../auth/dto/create-user.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { Public } from "../shared/guards/roles.guard";


@Controller('auth')
@Public()
export class AuthController {
    constructor(
        private readonly authService: AuthService,
    ) { }

    @Post('register')
    create(@Body() createUserDto: CreateUserDto) {
        return this.authService.createUser(createUserDto);
    }


    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto)
    }


    @Post('verify-email')
    async verifyEmail(@Body('token') dto: VerifyEmailDto) {
        return this.authService.verifyEmail(dto.token);
    }


    @Post('reset-password')
    resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(dto);
    }
}