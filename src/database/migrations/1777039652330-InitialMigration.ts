import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1777039652330 implements MigrationInterface {
    name = 'InitialMigration1777039652330'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`api_keys\` DROP FOREIGN KEY \`FK_e3bbbb8d9bff9eeedf94f881c5d\``);
        await queryRunner.query(`ALTER TABLE \`api_keys\` DROP COLUMN \`tenantEntityId\``);
        await queryRunner.query(`ALTER TABLE \`tenants\` ADD \`apiKeysId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`api_keys\` ADD CONSTRAINT \`FK_2cd545077d6e6e8378b051cf1b7\` FOREIGN KEY (\`tenantId\`) REFERENCES \`tenants\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tenants\` ADD CONSTRAINT \`FK_1732cf8032cac9df4f50ab33bfb\` FOREIGN KEY (\`apiKeysId\`) REFERENCES \`api_keys\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tenants\` DROP FOREIGN KEY \`FK_1732cf8032cac9df4f50ab33bfb\``);
        await queryRunner.query(`ALTER TABLE \`api_keys\` DROP FOREIGN KEY \`FK_2cd545077d6e6e8378b051cf1b7\``);
        await queryRunner.query(`ALTER TABLE \`tenants\` DROP COLUMN \`apiKeysId\``);
        await queryRunner.query(`ALTER TABLE \`api_keys\` ADD \`tenantEntityId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`api_keys\` ADD CONSTRAINT \`FK_e3bbbb8d9bff9eeedf94f881c5d\` FOREIGN KEY (\`tenantEntityId\`) REFERENCES \`tenants\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
