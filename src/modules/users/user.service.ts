import { UserEntity } from "./user.entity";
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';


export class UserService {
    constructor (
        @InjectRepository(UserEntity) private  readonly userRepository: Repository<UserEntity>
    ) {}

    findByEmail(email: string) {
        return this.userRepository.findOne({ where: { email } });
    }

    findByPhone(phone: number) {
        return this.userRepository.findOne({ where: { phone } });
    }
}