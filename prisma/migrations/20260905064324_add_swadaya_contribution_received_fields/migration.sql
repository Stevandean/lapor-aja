-- AlterTable
ALTER TABLE `swadaya_contributions` ADD COLUMN `proof_photo_path` VARCHAR(255) NULL,
    ADD COLUMN `received_at` DATETIME(3) NULL,
    ADD COLUMN `received_by` CHAR(36) NULL,
    ADD COLUMN `received_note` TEXT NULL;

-- AddForeignKey
ALTER TABLE `swadaya_contributions` ADD CONSTRAINT `swadaya_contributions_received_by_fkey` FOREIGN KEY (`received_by`) REFERENCES `profiles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
