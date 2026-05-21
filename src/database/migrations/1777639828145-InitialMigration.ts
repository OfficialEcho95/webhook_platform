import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1777639828145 implements MigrationInterface {
    name = 'InitialMigration1777639828145'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tenants\` ADD \`SubscriptionDate\` datetime NULL`);
        await queryRunner.query(`ALTER TABLE \`tenants\` ADD \`SubscriptionExpiry\` datetime NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tenants\` DROP COLUMN \`SubscriptionExpiry\``);
        await queryRunner.query(`ALTER TABLE \`tenants\` DROP COLUMN \`SubscriptionDate\``);
    }

}
