import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1779457488667 implements MigrationInterface {
    name = 'InitialMigration1779457488667'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tenants\` DROP FOREIGN KEY \`FK_1732cf8032cac9df4f50ab33bfb\``);
        await queryRunner.query(`ALTER TABLE \`tenants\` DROP COLUMN \`apiKeysId\``);
        await queryRunner.query(`ALTER TABLE \`tenants\` DROP COLUMN \`SubscriptionDate\``);
        await queryRunner.query(`ALTER TABLE \`tenants\` DROP COLUMN \`SubscriptionExpiry\``);
        await queryRunner.query(`ALTER TABLE \`tenants\` ADD \`subscriptionDate\` datetime NULL`);
        await queryRunner.query(`ALTER TABLE \`tenants\` ADD \`subscriptionExpiry\` datetime NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tenants\` DROP COLUMN \`subscriptionExpiry\``);
        await queryRunner.query(`ALTER TABLE \`tenants\` DROP COLUMN \`subscriptionDate\``);
        await queryRunner.query(`ALTER TABLE \`tenants\` ADD \`SubscriptionExpiry\` datetime NULL`);
        await queryRunner.query(`ALTER TABLE \`tenants\` ADD \`SubscriptionDate\` datetime NULL`);
        await queryRunner.query(`ALTER TABLE \`tenants\` ADD \`apiKeysId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`tenants\` ADD CONSTRAINT \`FK_1732cf8032cac9df4f50ab33bfb\` FOREIGN KEY (\`apiKeysId\`) REFERENCES \`api_keys\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
