import { Worker } from "bullmq";
import { transporter } from "nodemailer.setup";
import { RedisServer } from "redisServer";
import { Injectable } from '@nestjs/common';
import { ConfigService } from "@nestjs/config";

ConfigService

@Injectable()
export class AuthenticationWorkers {
    public registrationWorker: Worker;
    constructor(
        private redisServer: RedisServer,
        private configService: ConfigService,
    ) {
        this.registrationWorker = new Worker('authentication',
            async job => {
                switch (job.name) {
                    case 'new-user-registration':
                        const { email, message } = job.data;
                        return this.newUserRegistration(email, message);
                    case 'password-reset':
                        return this.passwordReset(job.data);
                    case 'email-verification':
                        return this.emailVerification(job.data);
                    case 'successful-login-notification':
                        return this.successfulLoginNotification(job.data);
                    default:
                        console.log(`No handler for job name: ${job.name}`);
                }
            },
            { connection: this.redisServer.getConnection() }
        )

        this.registrationWorker.on('completed', (job) => {
            console.log(`Job with id ${job.id} has been completed`);
        });

        this.registrationWorker.on('failed', (job, err) => {
            console.log(`Job with id ${job?.id} has failed with ${err.message}`);
        });
    }

    async newUserRegistration(email: string, message: string) {
        await transporter.sendMail({
            from:  `"Nest E-Commerce" <${process.env.MAIL_USER}>`,
            to: email,
            subject: "Welcome to Nest E-Commerce ✔",
            text: message,
            html: `<b>${message}</b>`,
        })
        console.log(`✅ Sent welcome email to ${email}`);
    }

    async passwordReset({ email, link }) {
        await transporter.sendMail({
            from: `"Nest E-Commerce" <${process.env.MAIL_USER}>`,
            to: email,
            subject: 'Password Reset Request',
            html: `
      <h2>Password Reset Requested</h2>
      <p>We received a request to reset your password. Click below to set a new one:</p>
      <a href="${link}" style="
        background: #007bff;
        color: white;
        padding: 10px 16px;
        text-decoration: none;
        border-radius: 6px;
        display: inline-block;
      ">Reset Password</a>
      <p>If you didn’t request this, please ignore this email.</p>
      <p>${link}</p>
    `,
        })
        console.log(`✅ Sent password reset to ${email}`);
    }

    async emailVerification({ email, link }) {
        await transporter.sendMail({
            from: `"Nest E-Commerce" <${process.env.MAIL_USER}>`,
            to: email,
            subject: 'Verify Your Email Address',
            html: `
      <h2>Welcome to Nest E-Commerce!</h2>
      <p>Click the link below to verify your email address:</p>
      <a href="${link}" 
         style="background:#4CAF50;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;">
         Verify Email
      </a>
      <p>If the button doesn’t work, you can also copy and paste this link into your browser:</p>
      <p>${link}</p>
    `,
        })

        console.log(`✅ Sent email verification to ${email}`);
    }


    async successfulLoginNotification({ email }) {
        await transporter.sendMail({
            from: "Nest E-Commerce 👻 <>",
            to: email,
            subject: "Successful Login Notification ✔",
            text: `Your account was logged into at ${Date.now}. If its not you please click the link to block your account`,
            html: `<b>You have successfully logged in to your account.</b>`,
        })

        console.log(`✅ Sent successful login notification to ${email}`);
    }
}