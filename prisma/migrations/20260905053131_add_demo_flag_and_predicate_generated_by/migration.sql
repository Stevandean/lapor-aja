-- AlterTable
ALTER TABLE `performance_snapshots` ADD COLUMN `generated_by` CHAR(36) NULL;

-- AlterTable
ALTER TABLE `reports` ADD COLUMN `is_demo_data` BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE `performance_snapshots` ADD CONSTRAINT `performance_snapshots_generated_by_fkey` FOREIGN KEY (`generated_by`) REFERENCES `profiles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
