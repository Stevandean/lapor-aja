-- AlterTable
ALTER TABLE `sla_category_thresholds` DROP COLUMN `use_business_days`;

-- CreateTable
CREATE TABLE `national_holidays` (
    `id` CHAR(36) NOT NULL,
    `date` DATE NOT NULL,
    `description` VARCHAR(200) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `national_holidays_date_key`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

