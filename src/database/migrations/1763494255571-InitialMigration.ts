import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1763494255571 implements MigrationInterface {
    name = 'InitialMigration1763494255571'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`tenants\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`uuid\` varchar(255) NOT NULL, \`slug\` varchar(255) NOT NULL, \`plan\` enum ('free', 'pro', 'enterprise') NOT NULL DEFAULT 'free', \`status\` enum ('active', 'suspended', 'deleted') NOT NULL DEFAULT 'active', \`webhookSecret\` varchar(255) NULL, \`settings\` json NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`ownerId\` int NULL, UNIQUE INDEX \`IDX_32731f181236a46182a38c992a\` (\`name\`), UNIQUE INDEX \`IDX_2310ecc5cb8be427097154b18f\` (\`slug\`), UNIQUE INDEX \`IDX_30223f2eb10f4a268450823208\` (\`uuid\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` int NOT NULL AUTO_INCREMENT, \`firstname\` varchar(255) NOT NULL, \`lastname\` varchar(255) NOT NULL, \`uuid\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`phone\` int NOT NULL, \`password\` varchar(255) NOT NULL, \`role\` enum ('customer', 'admin') NOT NULL DEFAULT 'customer', \`currentTenantId\` int NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_951b8f1dfc94ac1d0301a14b7e\` (\`uuid\`), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), UNIQUE INDEX \`IDX_a000cca60bcf04454e72769949\` (\`phone\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`tenants_users_users\` (\`tenantsId\` int NOT NULL, \`usersId\` int NOT NULL, INDEX \`IDX_2776b69cc0aebe8ac0da0668e3\` (\`tenantsId\`), INDEX \`IDX_11cb5109c782ba7d4d413af541\` (\`usersId\`), PRIMARY KEY (\`tenantsId\`, \`usersId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`tenants\` ADD CONSTRAINT \`FK_dccf2382a3ffe4edfc09b8eeb06\` FOREIGN KEY (\`ownerId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tenants_users_users\` ADD CONSTRAINT \`FK_2776b69cc0aebe8ac0da0668e38\` FOREIGN KEY (\`tenantsId\`) REFERENCES \`tenants\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`tenants_users_users\` ADD CONSTRAINT \`FK_11cb5109c782ba7d4d413af5417\` FOREIGN KEY (\`usersId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tenants_users_users\` DROP FOREIGN KEY \`FK_11cb5109c782ba7d4d413af5417\``);
        await queryRunner.query(`ALTER TABLE \`tenants_users_users\` DROP FOREIGN KEY \`FK_2776b69cc0aebe8ac0da0668e38\``);
        await queryRunner.query(`ALTER TABLE \`tenants\` DROP FOREIGN KEY \`FK_dccf2382a3ffe4edfc09b8eeb06\``);
        await queryRunner.query(`DROP INDEX \`IDX_11cb5109c782ba7d4d413af541\` ON \`tenants_users_users\``);
        await queryRunner.query(`DROP INDEX \`IDX_2776b69cc0aebe8ac0da0668e3\` ON \`tenants_users_users\``);
        await queryRunner.query(`DROP TABLE \`tenants_users_users\``);
        await queryRunner.query(`DROP INDEX \`IDX_a000cca60bcf04454e72769949\` ON \`users\``);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP INDEX \`IDX_951b8f1dfc94ac1d0301a14b7e\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
        await queryRunner.query(`DROP INDEX \`IDX_30223f2eb10f4a268450823208\` ON \`tenants\``);
        await queryRunner.query(`DROP INDEX \`IDX_2310ecc5cb8be427097154b18f\` ON \`tenants\``);
        await queryRunner.query(`DROP INDEX \`IDX_32731f181236a46182a38c992a\` ON \`tenants\``);
        await queryRunner.query(`DROP TABLE \`tenants\``);
    }

}
