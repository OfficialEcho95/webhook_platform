import { Queue } from 'bullmq';
import { RedisServer } from 'redisServer';
import { Injectable } from '@nestjs/common';

@Injectable() 
export class QueueAuthentication {

    public authenticationQueue: Queue;

    constructor(private redisServer: RedisServer) {
        this.authenticationQueue = new Queue('authentication', {
            connection: this.redisServer.getConnection()
        })
    }

    async queueNewUserRegistration (email: string, message: string) {
        await this.authenticationQueue.add('new-user-registration', { email, message });
    };

    async queuePasswordReset (email:string, link: string) {
        await this.authenticationQueue.add('password-reset', { email, link });
    };

    async queueEmailVerification (email:string, link: string) {
        await this.authenticationQueue.add('email-verification', { email, link });
    }

    async successfulLoginNotification (email:string) {
        await this.authenticationQueue.add('successful-login-notification', { email });
    }
}
