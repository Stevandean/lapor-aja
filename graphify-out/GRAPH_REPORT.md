# Graph Report - lapor-aja  (2026-10-28)

## Corpus Check
- 336 files · ~120,880 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 2, .toml 1, .prisma 1)

## Summary
- 1515 nodes · 5019 edges · 146 communities (75 shown, 71 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 60 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60
- Community 61
- Community 62
- Community 63
- Community 64
- Community 65
- Community 66
- Community 67
- Community 68
- Community 69
- Community 70
- Community 71
- Community 72
- Community 73
- Community 74
- Community 75
- Community 77
- Community 79

## God Nodes (most connected - your core abstractions)
1. `Card()` - 135 edges
2. `CardContent()` - 135 edges
3. `Button()` - 132 edges
4. `CardHeader()` - 126 edges
5. `CardTitle()` - 126 edges
6. `CardDescription()` - 124 edges
7. `next` - 114 edges
8. `Badge()` - 101 edges
9. `lucide-react` - 98 edges
10. `getProfile()` - 84 edges

## Surprising Connections (you probably didn't know these)
- `AdminAssetClassificationPanel()` --indirect_call--> `classifyAssetReport()`  [INFERRED]
  src/features/admin/components/AdminAssetClassificationPanel.tsx → src/features/admin/actions/classification.ts
- `AdminFollowUpPanel()` --indirect_call--> `processReportFollowUp()`  [INFERRED]
  src/features/admin/components/AdminFollowUpPanel.tsx → src/features/admin/actions/classification.ts
- `GenerateOfficialLetterButton()` --indirect_call--> `createOfficialLetter()`  [INFERRED]
  src/features/admin/components/GenerateOfficialLetterButton.tsx → src/features/admin/actions/officialLetters.ts
- `OfficialLetterPanel()` --indirect_call--> `createOfficialLetter()`  [INFERRED]
  src/features/admin/components/OfficialLetterPanel.tsx → src/features/admin/actions/officialLetters.ts
- `AdminReportRelationsPanel()` --indirect_call--> `linkRelatedReport()`  [INFERRED]
  src/features/admin/components/AdminReportRelationsPanel.tsx → src/features/admin/actions/relations.ts

## Import Cycles
- None detected.

## Communities (146 total, 71 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (48): playwright@^1.62.1, playwright, addGroupTable(), formatDateTime(), GET(), PRIORITY_LABELS, GET(), VillagePerformancePage() (+40 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (50): POST(), GET(), runtime, ALERT_ELIGIBLE_ROLES, ALERT_TYPE_ESCALATION_LEVEL, buildSlaAlertMessage(), buildSlaAlertSubject(), buildSlaEmailHtml() (+42 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (33): lucide-react, react, sonner, ButtonProps, ButtonSize, buttonSizes, ButtonVariant, buttonVariants (+25 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (52): CitizenReportDetailPage(), CitizenReportDetailPageProps, CitizenReportRelation, CitizenReportRelations, EmptyText(), formatDate(), formatEnum(), formatPriority() (+44 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (46): KasiReportDetailPage(), KasiReportDetailPageProps, formatContributionSummary(), formatRupiah(), formatStatus(), PublicSwadayaDetailPage(), PublicSwadayaDetailPageProps, BudgetRequest (+38 more)

### Community 5 - "Community 5"
Cohesion: 0.09
Nodes (38): formatRole(), VillageUserDetailPage(), VillageUserDetailPageProps, VillageUserEditFormUser, VillageUsersPage(), VillageUsersTableUsers, EmptyUsersState(), formatDate() (+30 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (27): AdminLettersPage(), EmptyState(), formatEnum(), getRelationName(), getReportNumber(), InfoItem(), GenerateOfficialLetterButton(), getAdminAssetClassificationReportDetail() (+19 more)

### Community 7 - "Community 7"
Cohesion: 0.16
Nodes (15): nextConfig, next, DashboardPage(), HomePage(), CreateReportPage(), requireHamletHead(), requireAdmin(), getCategoryMasterData() (+7 more)

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (21): Input(), InputProps, Textarea(), TextareaProps, BudgetItemDraft, EligibleReport, initialState, KasiBudgetRequestFormProps (+13 more)

### Community 9 - "Community 9"
Cohesion: 0.21
Nodes (25): reportHasBudgetRequests(), returnKasiReportAssignment(), startKasiReportProgress(), submitKasiProgressUpdate(), formatCurrency(), getBudgetItems(), getStringArray(), resolveKasiReport() (+17 more)

### Community 10 - "Community 10"
Cohesion: 0.12
Nodes (26): AdminReportDetailPage(), AgencyRelation, formatDateTime(), formatEnum(), getAgencyValue(), getRelationName(), getReporter(), InfoItem() (+18 more)

### Community 11 - "Community 11"
Cohesion: 0.17
Nodes (21): createAgency(), toggleAgencyStatus(), updateAgency(), createCategory(), parseSlaOverrideInput(), SlaOverrideInput, updateCategory(), createDusun() (+13 more)

### Community 12 - "Community 12"
Cohesion: 0.10
Nodes (23): createVillageUser(), isManagedUserRole(), requireUserManager(), toggleVillageUserStatus(), updateVillageUser(), HamletOption, initialState, roleOptions (+15 more)

### Community 13 - "Community 13"
Cohesion: 0.15
Nodes (20): SettingsPage(), AVATARS_ROOT, isValidAvatar(), requireProfile(), updateNotificationPreferences(), updateOwnPassword(), updateOwnProfile(), AvatarPreview() (+12 more)

### Community 14 - "Community 14"
Cohesion: 0.15
Nodes (24): AgencyRelation, BudgetStatusBadge(), EmptyState(), formatCurrency(), formatDate(), formatDateTime(), formatEnum(), formatNumber() (+16 more)

### Community 15 - "Community 15"
Cohesion: 0.14
Nodes (22): Select(), SelectProps, formatDate(), formatEnum(), getRelationName(), getReporterName(), getStatusBadgeClass(), getStatusLabel() (+14 more)

### Community 16 - "Community 16"
Cohesion: 0.17
Nodes (15): @prisma/client, isValidImage(), UPLOADS_ROOT, verifyReport(), RecordSlaEventParams, CreateStatusLogParams, createNotificationSafe(), NOTIFIABLE_STATUSES (+7 more)

### Community 17 - "Community 17"
Cohesion: 0.13
Nodes (19): HamletHeadHistoryPage(), HamletHeadReportsPage(), formatDateTime(), getRelationName(), getReporter(), HamletVerificationDetailPage(), InfoRow(), RelationName (+11 more)

### Community 18 - "Community 18"
Cohesion: 0.17
Nodes (19): KasiDashboardPage(), KasiReportTableReports, MissingSectionNotice(), KasiReportsPage(), KasiReportTableReports, MissingSectionNotice(), BudgetRequestRows, BudgetSchemaNotice() (+11 more)

### Community 19 - "Community 19"
Cohesion: 0.14
Nodes (19): PublicDashboardPage(), StatusBadge(), CitizenStatCard(), CitizenStatCardProps, formatDateTime(), getRelationName(), HamletVerificationHistoryTable(), HamletVerificationHistoryTableProps (+11 more)

### Community 20 - "Community 20"
Cohesion: 0.25
Nodes (20): classifyAssetReport(), processReportFollowUp(), sendOfficialLetterEmail(), ACTIVE_RELATION_STATUSES, bulkMarkRecurringReports(), bulkMergeDuplicateReports(), linkRelatedReport(), RECURRENCE_REFERENCE_STATUSES (+12 more)

### Community 21 - "Community 21"
Cohesion: 0.13
Nodes (21): ACTIVE_RELATION_STATUSES, AdminReportRelationsPanel(), AdminReportRelationsPanelProps, BulkCandidateOption(), CandidatePreview(), formatDate(), formatEnum(), formatRelationType() (+13 more)

### Community 22 - "Community 22"
Cohesion: 0.17
Nodes (19): formatEnum(), VillageAnalyticsPage(), CardTitle(), AnalyticsItem, VillageAnalyticsCard(), VillageAnalyticsCardProps, AnalyticsItem, CHART_COLORS (+11 more)

### Community 23 - "Community 23"
Cohesion: 0.18
Nodes (16): DashboardLayout(), toDisplayUrl(), DashboardNavbar(), DashboardNavbarProps, NavbarAvatar(), DashboardShell(), DashboardShellProps, formatDateTime() (+8 more)

### Community 24 - "Community 24"
Cohesion: 0.18
Nodes (20): hasReportProgressUpdates(), notifyUsersInternal(), closeSwadayaCampaign(), CONTRIBUTION_TYPES, openSwadayaCampaign(), receiveSwadayaContribution(), requireSwadayaCampaignManager(), requireVillageLeadershipOrAdmin() (+12 more)

### Community 25 - "Community 25"
Cohesion: 0.16
Nodes (16): AdminCategoryMasterDataPage(), Modal(), ModalProps, toggleCategoryStatus(), AgencyCreateModal(), initialState, CategoryCreateModal(), initialState (+8 more)

### Community 26 - "Community 26"
Cohesion: 0.13
Nodes (20): devDependencies, tailwindcss@^4, @tailwindcss/postcss@^4, @types/bcrypt@^6.0.0, @types/leaflet@^1.9.21, @types/node@^20, @types/react@^19, @types/react-dom@^19 (+12 more)

### Community 27 - "Community 27"
Cohesion: 0.14
Nodes (16): AdminReportsPage(), AdminReportsPageProps, AdminReportFilterBar(), AdminReportFilterBarProps, Option, SLA_STATUS_OPTIONS, AdminReport, AdminReportTable() (+8 more)

### Community 28 - "Community 28"
Cohesion: 0.18
Nodes (15): AdminDashboardPage(), formatDate(), QuickAction(), ReportPriority, ReportStatus, CompactStatCard(), VillageReportsPage(), dynamic (+7 more)

### Community 29 - "Community 29"
Cohesion: 0.15
Nodes (19): createInternalNotification(), CreateInternalNotificationParams, formatStatus(), getProfileById(), getProfilesById(), getReportById(), NOTIFIABLE_STATUSES, NotificationProfile (+11 more)

### Community 30 - "Community 30"
Cohesion: 0.16
Nodes (15): BadgeProps, BadgeVariant, badgeVariants, formatEnum(), SlaEmptyState(), SlaStatusBadge(), formatDateTime(), getRelationName() (+7 more)

### Community 31 - "Community 31"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 32 - "Community 32"
Cohesion: 0.11
Nodes (18): dependencies, clsx@^2.1.1, exceljs@^4.4.0, lucide-react@^1.18.0, next@16.2.9, prisma@^6.19.3, @prisma/client@^6.19.3, react@19.2.4 (+10 more)

### Community 33 - "Community 33"
Cohesion: 0.19
Nodes (16): AdminAssetClassificationDetailPage(), AssetClassificationDetailPageProps, formatEnum(), getRelationName(), getReporter(), getSectionName(), InfoRow(), PhotoCard() (+8 more)

### Community 34 - "Community 34"
Cohesion: 0.18
Nodes (12): AdminAssetClassificationPage(), AdminAgencyMasterDataPage(), AdminSlaRulesMasterDataPage(), CitizenReportsPage(), ComingSoonPage(), ComingSoonPageProps, CardDescription(), getAdminAssetClassificationReports() (+4 more)

### Community 35 - "Community 35"
Cohesion: 0.19
Nodes (13): BudgetRequestHistory(), BudgetSchemaNotice(), EligibleReports, formatCurrency(), formatDateTime(), formatEnum(), KasiBudgetPage(), KasiBudgetPageProps (+5 more)

### Community 36 - "Community 36"
Cohesion: 0.22
Nodes (12): AdminDusunMasterDataPage(), DusunCreateModal(), initialState, Dusun, DusunEditModal(), DusunStatusButton(), DusunTable(), DusunTableProps (+4 more)

### Community 37 - "Community 37"
Cohesion: 0.27
Nodes (14): BudgetRequestDetailPage(), BudgetRequestDetailPageProps, BudgetStatusBadge(), formatCurrency(), formatDateTime(), formatEnum(), formatNumber(), getRelationName() (+6 more)

### Community 38 - "Community 38"
Cohesion: 0.26
Nodes (11): DashboardNavItem, getDashboardNavigation(), Brand(), DashboardSidebar(), DashboardSidebarProps, isNavigationItemActive(), SidebarContent(), SidebarNav() (+3 more)

### Community 39 - "Community 39"
Cohesion: 0.22
Nodes (13): formatDate(), getMapCenter(), getMarkerStyleByPriority(), getRelationName(), HeatmapReport, priorityFilters, PriorityLegend(), RelationName (+5 more)

### Community 40 - "Community 40"
Cohesion: 0.19
Nodes (13): leaflet@^1.9.4, react-leaflet@^5.0.0, leaflet, react-leaflet, ReportLocationMap, calculateDistanceKm(), MapClickHandler(), MapResize() (+5 more)

### Community 41 - "Community 41"
Cohesion: 0.23
Nodes (11): AdminArchivePage(), AdminFollowUpPage(), AdminFollowUpTable(), AdminFollowUpTableProps, FollowUpReport, formatEnum(), getRelationName(), getReporter() (+3 more)

### Community 42 - "Community 42"
Cohesion: 0.29
Nodes (11): AdminLetterDetailPage(), AdminLetterDetailPageProps, formatDate(), formatEnum(), Button(), getButtonConfig(), initialState, OfficialLetterPrimaryActionButton() (+3 more)

### Community 43 - "Community 43"
Cohesion: 0.22
Nodes (12): formatDate(), formatSlaLabel(), getRelationName(), getReporter(), getStatusBadgeClass(), InfoItem(), KasiReportListItem, KasiReportTable() (+4 more)

### Community 44 - "Community 44"
Cohesion: 0.25
Nodes (12): activeStatuses, assignedReportSelect, getKasiAssignedReports(), getKasiBudgetPageData(), getKasiDashboardData(), getKasiReportDetail(), mapReportRow(), requireKasi() (+4 more)

### Community 45 - "Community 45"
Cohesion: 0.25
Nodes (13): BudgetRequest, BudgetStatusBadge(), formatCurrency(), formatDateTime(), getRelationName(), getReportStatusLabel(), InfoItem(), PriorityBadge() (+5 more)

### Community 46 - "Community 46"
Cohesion: 0.19
Nodes (12): bcrypt@^6.0.0, CATEGORY_NAMES, DUSUN_NAMES, generateReportNumber(), main(), PRIORITIES, prisma, randomInt() (+4 more)

### Community 47 - "Community 47"
Cohesion: 0.26
Nodes (9): createOfficialLetter(), finalizeOfficialLetter(), generateOfficialLetterNumber(), toRomanMonth(), buildOfficialLetterPdfHtml(), escapeHtml(), formatDate(), generateOfficialLetterPdf() (+1 more)

### Community 48 - "Community 48"
Cohesion: 0.23
Nodes (9): formatRupiah(), PublicSwadayaListPage(), Alert(), AlertProps, AlertVariant, alertVariants, CardFooter(), getOpenSwadayaCampaigns() (+1 more)

### Community 49 - "Community 49"
Cohesion: 0.26
Nodes (11): Badge(), CitizenReportTable(), CitizenReportTableProps, formatDate(), formatEnum(), getRelationName(), inProcessStatuses, PriorityBadge() (+3 more)

### Community 50 - "Community 50"
Cohesion: 0.24
Nodes (11): getAdminDashboardStats(), getEffectiveOverdueReportCount(), getReportCount(), calculateBusinessAwareDueDate(), EffectiveSlaStatus, isEffectiveSlaOverdue(), isNonBusinessDay(), isUtcWeekend() (+3 more)

### Community 51 - "Community 51"
Cohesion: 0.23
Nodes (10): AdminAssetClassificationTable(), AdminAssetClassificationTableProps, AssetClassificationReport, getRelationName(), getReporter(), InfoItem(), RelationName, ReporterProfile (+2 more)

### Community 52 - "Community 52"
Cohesion: 0.24
Nodes (11): formatHours(), InfoItem(), initialState, Priority, PRIORITY_LABELS, SlaRule, SlaRuleEditModal(), SlaRuleStatusButton() (+3 more)

### Community 53 - "Community 53"
Cohesion: 0.27
Nodes (7): next-auth@^5.0.0-beta.32, next-auth, auth, handlers, signOut, getUser(), requireAuth()

### Community 54 - "Community 54"
Cohesion: 0.33
Nodes (8): LoginPage(), RegisterPage(), AuthLayout(), AuthLayoutProps, MetricCard(), ProcessItem(), LoginForm(), RegisterForm()

### Community 55 - "Community 55"
Cohesion: 0.29
Nodes (9): formatDate(), getRelationName(), HamletHeadDashboardPage(), RecentReport, RecentReportList(), RelationName, HamletHeadStatCard(), HamletHeadStatCardProps (+1 more)

### Community 56 - "Community 56"
Cohesion: 0.29
Nodes (10): formatDate(), formatEnum(), getRelationName(), getReporterName(), InfoItem(), PriorityBadge(), RelationName, Reporter (+2 more)

### Community 57 - "Community 57"
Cohesion: 0.36
Nodes (9): formatDateTime(), formatEnum(), getStatusBadgeClass(), getStatusLabel(), getTimelineDescription(), getTimelineTitle(), ReportStatusLog, ReportStatusTimeline() (+1 more)

### Community 58 - "Community 58"
Cohesion: 0.33
Nodes (6): calculateDistanceKm(), createReport(), generateReportNumber(), isValidImage(), toRadians(), UPLOADS_ROOT

### Community 59 - "Community 59"
Cohesion: 0.36
Nodes (8): FocusItem(), formatDate(), getRelationName(), RecentReport, RecentVillageReportList(), RelationName, VillageDashboardPage(), getVillageDashboardData()

### Community 60 - "Community 60"
Cohesion: 0.36
Nodes (8): citizenReportListSelect, getCitizenDashboardData(), getCitizenReportDetail(), mapCitizenReportListItem(), mapRelatedReport(), progressStatuses, requireCitizen(), toDisplayUrl()

### Community 61 - "Community 61"
Cohesion: 0.33
Nodes (8): formatDate(), getRelationName(), getReporter(), HamletAssignedReportsTable(), HamletAssignedReportsTableProps, InfoItem(), RelationName, ReporterProfile

### Community 62 - "Community 62"
Cohesion: 0.46
Nodes (4): AdminLayout(), HamletHeadLayout(), VillageLayout(), requireRole()

### Community 63 - "Community 63"
Cohesion: 0.36
Nodes (7): formatDateTime(), formatEnum(), InfoItem(), initialState, OfficialLetter, OfficialLetterPanel(), OfficialLetterPanelProps

### Community 64 - "Community 64"
Cohesion: 0.43
Nodes (5): AdminVillageSectionsPage(), VillageSectionTable(), VillageSectionTableProps, getVillageSections(), VillageSection

### Community 65 - "Community 65"
Cohesion: 0.43
Nodes (6): JWT, next-auth, next-auth/jwt, Session, User, UserRole

### Community 66 - "Community 66"
Cohesion: 0.33
Nodes (5): eslintConfig, eslint@^9, eslint-config-next@16.2.9, eslint, eslint-config-next

### Community 67 - "Community 67"
Cohesion: 0.47
Nodes (3): metadata, RootLayout(), Toaster()

### Community 68 - "Community 68"
Cohesion: 0.40
Nodes (5): AdminFollowUpPanel(), AdminFollowUpPanelProps, AgencyOption, formatEnum(), initialState

### Community 69 - "Community 69"
Cohesion: 0.47
Nodes (5): formatDate(), formatPeriodLabel(), PERIOD_TYPE_LABELS, VillagePerformancePredicateHistory(), PerformancePredicateRecord

### Community 70 - "Community 70"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 71 - "Community 71"
Cohesion: 0.60
Nodes (4): GET(), SLA_LABELS, toCsvField(), getAdminReports()

### Community 72 - "Community 72"
Cohesion: 0.60
Nodes (4): KasiHistoryPage(), KasiReportTableReports, MissingSectionNotice(), getKasiProgressHistory()

### Community 73 - "Community 73"
Cohesion: 0.60
Nodes (4): ArchiveInfoCard(), VillageArchivePage(), ArchivedReport, getVillageArchivedReports()

### Community 75 - "Community 75"
Cohesion: 0.83
Nodes (3): MapInfoCard(), VillageHeatmapPage(), getVillageHeatmapReports()

## Knowledge Gaps
- **1 isolated node(s):** `{ GET, POST }`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 469 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **71 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Community 7` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 8`, `Community 9`, `Community 10`, `Community 11`, `Community 13`, `Community 14`, `Community 15`, `Community 16`, `Community 17`, `Community 18`, `Community 19`, `Community 20`, `Community 21`, `Community 22`, `Community 23`, `Community 24`, `Community 26`, `Community 27`, `Community 28`, `Community 29`, `Community 32`, `Community 33`, `Community 35`, `Community 37`, `Community 38`, `Community 39`, `Community 41`, `Community 42`, `Community 43`, `Community 44`, `Community 45`, `Community 47`, `Community 48`, `Community 49`, `Community 51`, `Community 53`, `Community 54`, `Community 55`, `Community 56`, `Community 58`, `Community 59`, `Community 60`, `Community 61`, `Community 62`, `Community 63`, `Community 67`, `Community 68`, `Community 71`, `Community 75`?**
  _High betweenness centrality (0.212) - this node is a cross-community bridge._
- **What connects `{ GET, POST }` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06779661016949153 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `Community 2` to `Community 0`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 8`, `Community 9`, `Community 10`, `Community 11`, `Community 12`, `Community 13`, `Community 14`, `Community 15`, `Community 17`, `Community 18`, `Community 19`, `Community 20`, `Community 21`, `Community 22`, `Community 23`, `Community 25`, `Community 26`, `Community 27`, `Community 28`, `Community 30`, `Community 32`, `Community 33`, `Community 34`, `Community 35`, `Community 36`, `Community 37`, `Community 38`, `Community 41`, `Community 42`, `Community 43`, `Community 45`, `Community 48`, `Community 49`, `Community 51`, `Community 52`, `Community 54`, `Community 55`, `Community 56`, `Community 57`, `Community 59`, `Community 61`, `Community 63`, `Community 64`, `Community 68`, `Community 73`, `Community 75`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06487434248977206 - nodes in this community are weakly interconnected._
- **Why does `Button()` connect `Community 42` to `Community 0`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 8`, `Community 9`, `Community 10`, `Community 11`, `Community 12`, `Community 13`, `Community 14`, `Community 15`, `Community 17`, `Community 18`, `Community 19`, `Community 20`, `Community 21`, `Community 23`, `Community 24`, `Community 25`, `Community 27`, `Community 30`, `Community 33`, `Community 35`, `Community 36`, `Community 37`, `Community 38`, `Community 39`, `Community 43`, `Community 45`, `Community 48`, `Community 49`, `Community 52`, `Community 54`, `Community 55`, `Community 56`, `Community 59`, `Community 63`, `Community 68`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.07922077922077922 - nodes in this community are weakly interconnected._