-- DropForeignKey
ALTER TABLE `performance_snapshots` DROP FOREIGN KEY `performance_snapshots_profile_id_fkey`;

-- DropIndex
DROP INDEX `performance_snapshots_profile_id_fkey` ON `performance_snapshots`;

-- AlterTable
ALTER TABLE `performance_snapshots` DROP COLUMN `profile_id`,
    ADD COLUMN `late_reports` INTEGER NOT NULL,
    ADD COLUMN `on_time_reports` INTEGER NOT NULL,
    ADD COLUMN `section_id` CHAR(36) NULL,
    MODIFY `period_type` ENUM('bulanan', 'triwulanan') NOT NULL,
    MODIFY `scope_type` ENUM('seksi', 'dusun', 'kategori') NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `performance_snapshots_period_type_period_start_period_end_sc_key` ON `performance_snapshots`(`period_type`, `period_start`, `period_end`, `scope_type`);

-- AddForeignKey
ALTER TABLE `performance_snapshots` ADD CONSTRAINT `performance_snapshots_section_id_fkey` FOREIGN KEY (`section_id`) REFERENCES `village_sections`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

