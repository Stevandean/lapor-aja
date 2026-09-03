-- CreateTable
CREATE TABLE `dusuns` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `dusuns_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `village_sections` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `code` VARCHAR(30) NULL,
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `village_sections_name_key`(`name`),
    UNIQUE INDEX `village_sections_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `default_priority` ENUM('rendah', 'sedang', 'tinggi', 'darurat') NOT NULL DEFAULT 'sedang',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `categories_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `agencies` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `type` VARCHAR(100) NULL,
    `address` TEXT NULL,
    `email` VARCHAR(150) NULL,
    `phone_number` VARCHAR(30) NULL,
    `description` TEXT NULL,
    `contact_person` VARCHAR(150) NULL,
    `phone` VARCHAR(30) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `agencies_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sla_rules` (
    `id` CHAR(36) NOT NULL,
    `priority` ENUM('rendah', 'sedang', 'tinggi', 'darurat') NOT NULL,
    `verification_hours` INTEGER NOT NULL,
    `resolution_hours` INTEGER NOT NULL,
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sla_rules_priority_key`(`priority`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sla_category_thresholds` (
    `id` CHAR(36) NOT NULL,
    `category_id` CHAR(36) NOT NULL,
    `verification_hours` INTEGER NOT NULL,
    `resolution_hours` INTEGER NOT NULL,
    `use_business_days` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sla_category_thresholds_category_id_key`(`category_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `profiles` (
    `id` CHAR(36) NOT NULL,
    `full_name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `phone_number` VARCHAR(30) NULL,
    `role` ENUM('public', 'admin', 'kepala_desa', 'sekdes', 'kepala_dusun', 'kasi') NOT NULL DEFAULT 'public',
    `dusun_id` CHAR(36) NULL,
    `section_id` CHAR(36) NULL,
    `avatar_url` VARCHAR(255) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `notification_internal_enabled` BOOLEAN NOT NULL DEFAULT true,
    `notification_email_enabled` BOOLEAN NOT NULL DEFAULT true,
    `notification_whatsapp_enabled` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `profiles_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reports` (
    `id` CHAR(36) NOT NULL,
    `report_number` VARCHAR(50) NOT NULL,
    `reporter_id` CHAR(36) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT NOT NULL,
    `category_id` CHAR(36) NULL,
    `dusun_id` CHAR(36) NULL,
    `latitude` DECIMAL(10, 7) NOT NULL,
    `longitude` DECIMAL(10, 7) NOT NULL,
    `auto_address` TEXT NULL,
    `manual_address` TEXT NULL,
    `status` ENUM('pending', 'approved', 'rejected', 'need_verification', 'verified_valid', 'verified_invalid', 'classified', 'handled_by_village', 'forwarded_to_agency', 'waiting_budget', 'in_progress', 'resolved', 'archived', 'merged') NOT NULL DEFAULT 'pending',
    `priority` ENUM('rendah', 'sedang', 'tinggi', 'darurat') NOT NULL DEFAULT 'sedang',
    `asset_status` ENUM('aset_desa', 'bukan_aset_desa', 'belum_diketahui') NOT NULL DEFAULT 'belum_diketahui',
    `authority_level` ENUM('desa', 'kabupaten_kota', 'provinsi', 'nasional', 'belum_diketahui') NOT NULL DEFAULT 'belum_diketahui',
    `follow_up_type` ENUM('ditangani_desa', 'diteruskan_ke_dinas', 'diusulkan_musrenbang', 'menunggu_anggaran', 'belum_ditentukan') NOT NULL DEFAULT 'belum_ditentukan',
    `assigned_agency_id` CHAR(36) NULL,
    `agency_id` CHAR(36) NULL,
    `assigned_section_id` CHAR(36) NULL,
    `rejection_reason` TEXT NULL,
    `admin_note` TEXT NULL,
    `internal_handling_note` TEXT NULL,
    `verification_due_at` DATETIME(3) NULL,
    `resolution_due_at` DATETIME(3) NULL,
    `resolved_at` DATETIME(3) NULL,
    `sla_status` ENUM('on_time', 'at_risk', 'critical', 'overdue', 'completed') NOT NULL DEFAULT 'on_time',
    `archived_at` DATETIME(3) NULL,
    `archived_by` CHAR(36) NULL,
    `archive_reason` TEXT NULL,
    `merged_into_report_id` CHAR(36) NULL,
    `merged_at` DATETIME(3) NULL,
    `merged_by` CHAR(36) NULL,
    `merge_reason` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `reports_report_number_key`(`report_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_photos` (
    `id` CHAR(36) NOT NULL,
    `report_id` CHAR(36) NOT NULL,
    `photo_url` VARCHAR(255) NOT NULL,
    `file_path` VARCHAR(255) NOT NULL,
    `uploaded_by` CHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_comments` (
    `id` CHAR(36) NOT NULL,
    `report_id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `comment` TEXT NOT NULL,
    `is_internal` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_status_logs` (
    `id` CHAR(36) NOT NULL,
    `report_id` CHAR(36) NOT NULL,
    `old_status` ENUM('pending', 'approved', 'rejected', 'need_verification', 'verified_valid', 'verified_invalid', 'classified', 'handled_by_village', 'forwarded_to_agency', 'waiting_budget', 'in_progress', 'resolved', 'archived', 'merged') NULL,
    `new_status` ENUM('pending', 'approved', 'rejected', 'need_verification', 'verified_valid', 'verified_invalid', 'classified', 'handled_by_village', 'forwarded_to_agency', 'waiting_budget', 'in_progress', 'resolved', 'archived', 'merged') NOT NULL,
    `changed_by` CHAR(36) NULL,
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_verifications` (
    `id` CHAR(36) NOT NULL,
    `report_id` CHAR(36) NOT NULL,
    `verified_by` CHAR(36) NOT NULL,
    `is_valid` BOOLEAN NOT NULL,
    `verification_note` TEXT NULL,
    `verified_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `verification_photos` (
    `id` CHAR(36) NOT NULL,
    `verification_id` CHAR(36) NOT NULL,
    `photo_url` VARCHAR(255) NOT NULL,
    `file_path` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `official_letters` (
    `id` CHAR(36) NOT NULL,
    `report_id` CHAR(36) NOT NULL,
    `letter_type` ENUM('surat_tugas_verifikasi', 'surat_permohonan_perbaikan') NOT NULL,
    `letter_number` VARCHAR(100) NULL,
    `subject` VARCHAR(255) NOT NULL,
    `recipient_agency_id` CHAR(36) NULL,
    `generated_by` CHAR(36) NULL,
    `generated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `signed_by` CHAR(36) NULL,
    `signed_at` DATETIME(3) NULL,
    `pdf_url` VARCHAR(255) NULL,
    `file_path` VARCHAR(255) NULL,
    `status` ENUM('draft', 'final', 'sent') NOT NULL DEFAULT 'draft',
    `body` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NULL,
    `report_id` CHAR(36) NULL,
    `recipient_email` VARCHAR(150) NULL,
    `recipient_phone` VARCHAR(30) NULL,
    `subject` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `status` ENUM('pending', 'sent', 'failed') NOT NULL DEFAULT 'pending',
    `channel` VARCHAR(30) NOT NULL DEFAULT 'email',
    `provider` VARCHAR(50) NULL,
    `provider_message_id` VARCHAR(150) NULL,
    `sent_at` DATETIME(3) NULL,
    `read_at` DATETIME(3) NULL,
    `error_message` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_section_assignments` (
    `id` CHAR(36) NOT NULL,
    `report_id` CHAR(36) NOT NULL,
    `section_id` CHAR(36) NOT NULL,
    `assigned_to` CHAR(36) NULL,
    `assigned_by` CHAR(36) NULL,
    `status` ENUM('assigned', 'accepted', 'returned', 'in_progress', 'waiting_budget', 'escalation_requested', 'completion_submitted', 'completed', 'cancelled') NOT NULL DEFAULT 'assigned',
    `assignment_note` TEXT NULL,
    `returned_reason` TEXT NULL,
    `handling_plan` TEXT NULL,
    `technical_note` TEXT NULL,
    `estimated_completion_at` DATETIME(3) NULL,
    `estimated_budget` DECIMAL(14, 2) NULL,
    `budget_note` TEXT NULL,
    `escalation_reason` TEXT NULL,
    `completion_note` TEXT NULL,
    `accepted_at` DATETIME(3) NULL,
    `returned_at` DATETIME(3) NULL,
    `started_at` DATETIME(3) NULL,
    `budget_requested_at` DATETIME(3) NULL,
    `escalation_requested_at` DATETIME(3) NULL,
    `submitted_at` DATETIME(3) NULL,
    `completed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_progress_updates` (
    `id` CHAR(36) NOT NULL,
    `report_id` CHAR(36) NOT NULL,
    `assignment_id` CHAR(36) NULL,
    `created_by` CHAR(36) NULL,
    `progress_title` VARCHAR(200) NOT NULL,
    `progress_note` TEXT NULL,
    `progress_status` ENUM('plan', 'progress', 'budget_request', 'escalation_request', 'completion_submission', 'review_note') NOT NULL DEFAULT 'progress',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_progress_photos` (
    `id` CHAR(36) NOT NULL,
    `progress_update_id` CHAR(36) NOT NULL,
    `file_path` VARCHAR(255) NOT NULL,
    `photo_url` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_relations` (
    `id` CHAR(36) NOT NULL,
    `source_report_id` CHAR(36) NOT NULL,
    `target_report_id` CHAR(36) NOT NULL,
    `relation_type` ENUM('duplicate', 'recurrence', 'related') NOT NULL,
    `reason` TEXT NULL,
    `note` TEXT NULL,
    `created_by` CHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_relation_logs` (
    `id` CHAR(36) NOT NULL,
    `source_report_id` CHAR(36) NOT NULL,
    `target_report_id` CHAR(36) NOT NULL,
    `relation_type` ENUM('duplicate', 'recurrence', 'related') NOT NULL,
    `action` ENUM('created', 'removed') NOT NULL,
    `reason` TEXT NULL,
    `created_by` CHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_budget_requests` (
    `id` CHAR(36) NOT NULL,
    `report_id` CHAR(36) NOT NULL,
    `requested_by` CHAR(36) NULL,
    `section_id` CHAR(36) NULL,
    `summary_note` TEXT NOT NULL,
    `total_estimated_budget` DECIMAL(14, 2) NOT NULL DEFAULT 0,
    `status` ENUM('submitted', 'approved', 'rejected') NOT NULL DEFAULT 'submitted',
    `reviewed_by` CHAR(36) NULL,
    `reviewed_at` DATETIME(3) NULL,
    `review_note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_budget_request_items` (
    `id` CHAR(36) NOT NULL,
    `budget_request_id` CHAR(36) NOT NULL,
    `item_name` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `quantity` DECIMAL(10, 2) NOT NULL DEFAULT 1,
    `unit` VARCHAR(30) NOT NULL DEFAULT 'unit',
    `unit_price` DECIMAL(14, 2) NOT NULL DEFAULT 0,
    `subtotal` DECIMAL(14, 2) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_sla_events` (
    `id` CHAR(36) NOT NULL,
    `report_id` CHAR(36) NOT NULL,
    `event_type` ENUM('deadline_started', 'paused_budget', 'resumed_budget', 'completed', 'merged') NOT NULL,
    `previous_resolution_due_at` DATETIME(3) NULL,
    `new_resolution_due_at` DATETIME(3) NULL,
    `note` TEXT NULL,
    `created_by` CHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_sla_alert_notifications` (
    `id` CHAR(36) NOT NULL,
    `report_id` CHAR(36) NOT NULL,
    `alert_type` ENUM('at_risk', 'critical', 'overdue') NOT NULL,
    `escalation_level` ENUM('level_1', 'level_2', 'level_3') NOT NULL DEFAULT 'level_1',
    `triggered_by` CHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `performance_snapshots` (
    `id` CHAR(36) NOT NULL,
    `period_type` VARCHAR(20) NOT NULL,
    `period_start` DATE NOT NULL,
    `period_end` DATE NOT NULL,
    `scope_type` ENUM('kasi', 'dusun', 'kategori') NOT NULL,
    `profile_id` CHAR(36) NULL,
    `dusun_id` CHAR(36) NULL,
    `category_id` CHAR(36) NULL,
    `total_reports` INTEGER NOT NULL,
    `on_time_percentage` DECIMAL(5, 2) NOT NULL,
    `avg_resolution_hours` DECIMAL(10, 2) NOT NULL,
    `badge_label` VARCHAR(150) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `swadaya_campaigns` (
    `id` CHAR(36) NOT NULL,
    `report_id` CHAR(36) NOT NULL,
    `status` ENUM('open', 'closed', 'cancelled') NOT NULL DEFAULT 'open',
    `target_note` TEXT NULL,
    `opened_by` CHAR(36) NULL,
    `opened_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `closed_at` DATETIME(3) NULL,
    `closed_reason` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `swadaya_contributions` (
    `id` CHAR(36) NOT NULL,
    `campaign_id` CHAR(36) NOT NULL,
    `contributor_id` CHAR(36) NULL,
    `contributor_name` VARCHAR(150) NOT NULL,
    `contributor_phone` VARCHAR(30) NULL,
    `type` ENUM('uang', 'material', 'logistik', 'tenaga') NOT NULL,
    `amount` DECIMAL(14, 2) NULL,
    `item_description` TEXT NULL,
    `item_quantity` DECIMAL(10, 2) NULL,
    `item_unit` VARCHAR(30) NULL,
    `availability_note` TEXT NULL,
    `status` ENUM('pending', 'verified', 'received', 'rejected') NOT NULL DEFAULT 'pending',
    `verified_by` CHAR(36) NULL,
    `verified_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sla_category_thresholds` ADD CONSTRAINT `sla_category_thresholds_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_dusun_id_fkey` FOREIGN KEY (`dusun_id`) REFERENCES `dusuns`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_section_id_fkey` FOREIGN KEY (`section_id`) REFERENCES `village_sections`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_reporter_id_fkey` FOREIGN KEY (`reporter_id`) REFERENCES `profiles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_dusun_id_fkey` FOREIGN KEY (`dusun_id`) REFERENCES `dusuns`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_assigned_agency_id_fkey` FOREIGN KEY (`assigned_agency_id`) REFERENCES `agencies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_agency_id_fkey` FOREIGN KEY (`agency_id`) REFERENCES `agencies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_assigned_section_id_fkey` FOREIGN KEY (`assigned_section_id`) REFERENCES `village_sections`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_archived_by_fkey` FOREIGN KEY (`archived_by`) REFERENCES `profiles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_merged_by_fkey` FOREIGN KEY (`merged_by`) REFERENCES `profiles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_merged_into_report_id_fkey` FOREIGN KEY (`merged_into_report_id`) REFERENCES `reports`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_photos` ADD CONSTRAINT `report_photos_report_id_fkey` FOREIGN KEY (`report_id`) REFERENCES `reports`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_photos` ADD CONSTRAINT `report_photos_uploaded_by_fkey` FOREIGN KEY (`uploaded_by`) REFERENCES `profiles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_comments` ADD CONSTRAINT `report_comments_report_id_fkey` FOREIGN KEY (`report_id`) REFERENCES `reports`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_comments` ADD CONSTRAINT `report_comments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_status_logs` ADD CONSTRAINT `report_status_logs_report_id_fkey` FOREIGN KEY (`report_id`) REFERENCES `reports`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_status_logs` ADD CONSTRAINT `report_status_logs_changed_by_fkey` FOREIGN KEY (`changed_by`) REFERENCES `profiles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_verifications` ADD CONSTRAINT `report_verifications_report_id_fkey` FOREIGN KEY (`report_id`) REFERENCES `reports`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_verifications` ADD CONSTRAINT `report_verifications_verified_by_fkey` FOREIGN KEY (`verified_by`) REFERENCES `profiles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `verification_photos` ADD CONSTRAINT `verification_photos_verification_id_fkey` FOREIGN KEY (`verification_id`) REFERENCES `report_verifications`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `official_letters` ADD CONSTRAINT `official_letters_report_id_fkey` FOREIGN KEY (`report_id`) REFERENCES `reports`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `official_letters` ADD CONSTRAINT `official_letters_recipient_agency_id_fkey` FOREIGN KEY (`recipient_agency_id`) REFERENCES `agencies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `official_letters` ADD CONSTRAINT `official_letters_generated_by_fkey` FOREIGN KEY (`generated_by`) REFERENCES `profiles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `official_letters` ADD CONSTRAINT `official_letters_signed_by_fkey` FOREIGN KEY (`signed_by`) REFERENCES `profiles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_report_id_fkey` FOREIGN KEY (`report_id`) REFERENCES `reports`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_section_assignments` ADD CONSTRAINT `report_section_assignments_report_id_fkey` FOREIGN KEY (`report_id`) REFERENCES `reports`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_section_assignments` ADD CONSTRAINT `report_section_assignments_section_id_fkey` FOREIGN KEY (`section_id`) REFERENCES `village_sections`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_section_assignments` ADD CONSTRAINT `report_section_assignments_assigned_to_fkey` FOREIGN KEY (`assigned_to`) REFERENCES `profiles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_section_assignments` ADD CONSTRAINT `report_section_assignments_assigned_by_fkey` FOREIGN KEY (`assigned_by`) REFERENCES `profiles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_progress_updates` ADD CONSTRAINT `report_progress_updates_report_id_fkey` FOREIGN KEY (`report_id`) REFERENCES `reports`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_progress_updates` ADD CONSTRAINT `report_progress_updates_assignment_id_fkey` FOREIGN KEY (`assignment_id`) REFERENCES `report_section_assignments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_progress_updates` ADD CONSTRAINT `report_progress_updates_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `profiles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_progress_photos` ADD CONSTRAINT `report_progress_photos_progress_update_id_fkey` FOREIGN KEY (`progress_update_id`) REFERENCES `report_progress_updates`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_relations` ADD CONSTRAINT `report_relations_source_report_id_fkey` FOREIGN KEY (`source_report_id`) REFERENCES `reports`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_relations` ADD CONSTRAINT `report_relations_target_report_id_fkey` FOREIGN KEY (`target_report_id`) REFERENCES `reports`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_relations` ADD CONSTRAINT `report_relations_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `profiles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_relation_logs` ADD CONSTRAINT `report_relation_logs_source_report_id_fkey` FOREIGN KEY (`source_report_id`) REFERENCES `reports`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_relation_logs` ADD CONSTRAINT `report_relation_logs_target_report_id_fkey` FOREIGN KEY (`target_report_id`) REFERENCES `reports`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_relation_logs` ADD CONSTRAINT `report_relation_logs_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `profiles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_budget_requests` ADD CONSTRAINT `report_budget_requests_report_id_fkey` FOREIGN KEY (`report_id`) REFERENCES `reports`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_budget_requests` ADD CONSTRAINT `report_budget_requests_section_id_fkey` FOREIGN KEY (`section_id`) REFERENCES `village_sections`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_budget_requests` ADD CONSTRAINT `report_budget_requests_requested_by_fkey` FOREIGN KEY (`requested_by`) REFERENCES `profiles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_budget_requests` ADD CONSTRAINT `report_budget_requests_reviewed_by_fkey` FOREIGN KEY (`reviewed_by`) REFERENCES `profiles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_budget_request_items` ADD CONSTRAINT `report_budget_request_items_budget_request_id_fkey` FOREIGN KEY (`budget_request_id`) REFERENCES `report_budget_requests`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_sla_events` ADD CONSTRAINT `report_sla_events_report_id_fkey` FOREIGN KEY (`report_id`) REFERENCES `reports`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_sla_events` ADD CONSTRAINT `report_sla_events_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `profiles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_sla_alert_notifications` ADD CONSTRAINT `report_sla_alert_notifications_report_id_fkey` FOREIGN KEY (`report_id`) REFERENCES `reports`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_sla_alert_notifications` ADD CONSTRAINT `report_sla_alert_notifications_triggered_by_fkey` FOREIGN KEY (`triggered_by`) REFERENCES `profiles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `performance_snapshots` ADD CONSTRAINT `performance_snapshots_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `performance_snapshots` ADD CONSTRAINT `performance_snapshots_dusun_id_fkey` FOREIGN KEY (`dusun_id`) REFERENCES `dusuns`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `performance_snapshots` ADD CONSTRAINT `performance_snapshots_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `swadaya_campaigns` ADD CONSTRAINT `swadaya_campaigns_report_id_fkey` FOREIGN KEY (`report_id`) REFERENCES `reports`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `swadaya_campaigns` ADD CONSTRAINT `swadaya_campaigns_opened_by_fkey` FOREIGN KEY (`opened_by`) REFERENCES `profiles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `swadaya_contributions` ADD CONSTRAINT `swadaya_contributions_campaign_id_fkey` FOREIGN KEY (`campaign_id`) REFERENCES `swadaya_campaigns`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `swadaya_contributions` ADD CONSTRAINT `swadaya_contributions_contributor_id_fkey` FOREIGN KEY (`contributor_id`) REFERENCES `profiles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `swadaya_contributions` ADD CONSTRAINT `swadaya_contributions_verified_by_fkey` FOREIGN KEY (`verified_by`) REFERENCES `profiles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
