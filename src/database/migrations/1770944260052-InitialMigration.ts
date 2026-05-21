import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1770944260052 implements MigrationInterface {
    name = 'InitialMigration1770944260052'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tenants\` DROP FOREIGN KEY \`FK_dccf2382a3ffe4edfc09b8eeb06\``);
        await queryRunner.query(`CREATE TABLE \`tenant_invitations\` (\`id\` int NOT NULL AUTO_INCREMENT, \`tenantId\` int NOT NULL, \`email\` varchar(255) NOT NULL, \`invitedBy\` int NOT NULL, \`token\` varchar(255) NOT NULL, \`expiresAt\` timestamp NOT NULL, \`accepted\` tinyint NOT NULL DEFAULT 0, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_79964092dc2230851858fa1ab7\` (\`token\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`payments\` (\`id\` int NOT NULL AUTO_INCREMENT, \`tenantId\` int NOT NULL, \`userId\` int NOT NULL, \`reference\` varchar(255) NOT NULL, \`amount\` int NOT NULL, \`currency\` varchar(255) NOT NULL, \`plan\` varchar(255) NOT NULL, \`verified\` tinyint NOT NULL DEFAULT 0, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`events\` (\`id\` varchar(255) NOT NULL, \`tenantId\` int NOT NULL, \`actorId\` int NULL, \`eventType\` varchar(255) NOT NULL, \`payload\` json NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`destinations\` (\`id\` int NOT NULL AUTO_INCREMENT, \`tenantId\` int NOT NULL, \`eventType\` varchar(255) NOT NULL, \`url\` varchar(255) NOT NULL, \`secret\` varchar(255) NULL, \`headers\` json NULL, \`maxRetries\` int NOT NULL DEFAULT '3', \`retryDelaySeconds\` int NOT NULL DEFAULT '60', \`isActive\` tinyint NOT NULL DEFAULT 1, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_de16944a594388950fbb90545d\` (\`tenantId\`, \`eventType\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`deliveries\` (\`id\` int NOT NULL AUTO_INCREMENT, \`eventId\` varchar(255) NOT NULL, \`destinationId\` int NOT NULL, \`status\` enum ('pending', 'success', 'failed', 'retrying') NOT NULL DEFAULT 'pending', \`attemptCount\` int NOT NULL DEFAULT '0', \`lastAttemptAt\` timestamp NULL, \`responseStatus\` int NULL, \`responseBody\` text NULL, \`errorMessage\` text NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_fd09bff2cfb1806c274a69d1f3\` (\`eventId\`, \`destinationId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`api_keys\` (\`id\` int NOT NULL AUTO_INCREMENT, \`tenantId\` int NOT NULL, \`key\` varchar(255) NOT NULL, \`active\` tinyint NOT NULL DEFAULT 1, \`description\` varchar(255) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`revokedAt\` datetime NULL, \`tenantEntityId\` int NULL, UNIQUE INDEX \`IDX_e42cf55faeafdcce01a82d2484\` (\`key\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`tenant_users\` (\`tenantId\` int NOT NULL, \`userId\` int NOT NULL, INDEX \`IDX_b60b5094f416190c9b3103cba2\` (\`tenantId\`), INDEX \`IDX_5c0a747551be06a29ac8196037\` (\`userId\`), PRIMARY KEY (\`tenantId\`, \`userId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`isVerified\` tinyint NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE \`tenants\` CHANGE \`ownerId\` \`ownerId\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`currentTenantId\``);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`currentTenantId\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`tenants\` ADD CONSTRAINT \`FK_dccf2382a3ffe4edfc09b8eeb06\` FOREIGN KEY (\`ownerId\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`deliveries\` ADD CONSTRAINT \`FK_194bed6516205136efad113ff1c\` FOREIGN KEY (\`eventId\`) REFERENCES \`events\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`deliveries\` ADD CONSTRAINT \`FK_fcd41dde9a1a3facd50fb926029\` FOREIGN KEY (\`destinationId\`) REFERENCES \`destinations\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`api_keys\` ADD CONSTRAINT \`FK_e3bbbb8d9bff9eeedf94f881c5d\` FOREIGN KEY (\`tenantEntityId\`) REFERENCES \`tenants\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tenant_users\` ADD CONSTRAINT \`FK_b60b5094f416190c9b3103cba2a\` FOREIGN KEY (\`tenantId\`) REFERENCES \`tenants\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`tenant_users\` ADD CONSTRAINT \`FK_5c0a747551be06a29ac8196037e\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tenant_users\` DROP FOREIGN KEY \`FK_5c0a747551be06a29ac8196037e\``);
        await queryRunner.query(`ALTER TABLE \`tenant_users\` DROP FOREIGN KEY \`FK_b60b5094f416190c9b3103cba2a\``);
        await queryRunner.query(`ALTER TABLE \`api_keys\` DROP FOREIGN KEY \`FK_e3bbbb8d9bff9eeedf94f881c5d\``);
        await queryRunner.query(`ALTER TABLE \`deliveries\` DROP FOREIGN KEY \`FK_fcd41dde9a1a3facd50fb926029\``);
        await queryRunner.query(`ALTER TABLE \`deliveries\` DROP FOREIGN KEY \`FK_194bed6516205136efad113ff1c\``);
        await queryRunner.query(`ALTER TABLE \`tenants\` DROP FOREIGN KEY \`FK_dccf2382a3ffe4edfc09b8eeb06\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`currentTenantId\``);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`currentTenantId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`tenants\` CHANGE \`ownerId\` \`ownerId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`isVerified\``);
        await queryRunner.query(`DROP INDEX \`IDX_5c0a747551be06a29ac8196037\` ON \`tenant_users\``);
        await queryRunner.query(`DROP INDEX \`IDX_b60b5094f416190c9b3103cba2\` ON \`tenant_users\``);
        await queryRunner.query(`DROP TABLE \`tenant_users\``);
        await queryRunner.query(`DROP INDEX \`IDX_e42cf55faeafdcce01a82d2484\` ON \`api_keys\``);
        await queryRunner.query(`DROP TABLE \`api_keys\``);
        await queryRunner.query(`DROP INDEX \`IDX_fd09bff2cfb1806c274a69d1f3\` ON \`deliveries\``);
        await queryRunner.query(`DROP TABLE \`deliveries\``);
        await queryRunner.query(`DROP INDEX \`IDX_de16944a594388950fbb90545d\` ON \`destinations\``);
        await queryRunner.query(`DROP TABLE \`destinations\``);
        await queryRunner.query(`DROP TABLE \`events\``);
        await queryRunner.query(`DROP TABLE \`payments\``);
        await queryRunner.query(`DROP INDEX \`IDX_79964092dc2230851858fa1ab7\` ON \`tenant_invitations\``);
        await queryRunner.query(`DROP TABLE \`tenant_invitations\``);
        await queryRunner.query(`ALTER TABLE \`tenants\` ADD CONSTRAINT \`FK_dccf2382a3ffe4edfc09b8eeb06\` FOREIGN KEY (\`ownerId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
