-- =====================================================
-- Full Database Restore from JSON Backup
-- TEDJANI INDUSTRIAL GROUP
-- Generated: 2026-02-25
-- WARNING: This will DELETE all existing data!
-- =====================================================

-- Truncate all tables (children first)
TRUNCATE TABLE sessions CASCADE;
TRUNCATE TABLE workshop_expenses CASCADE;
TRUNCATE TABLE attendance_scans CASCADE;
TRUNCATE TABLE attendance_days CASCADE;
TRUNCATE TABLE worker_warnings CASCADE;
TRUNCATE TABLE worker_transactions CASCADE;
TRUNCATE TABLE machine_daily_entries CASCADE;
TRUNCATE TABLE raw_material_purchases CASCADE;
TRUNCATE TABLE spare_parts_consumption CASCADE;
TRUNCATE TABLE spare_parts_purchases CASCADE;
TRUNCATE TABLE project_transactions CASCADE;
TRUNCATE TABLE truck_trips CASCADE;
TRUNCATE TABLE truck_expenses CASCADE;
TRUNCATE TABLE debt_payments CASCADE;
TRUNCATE TABLE member_transfers CASCADE;
TRUNCATE TABLE external_funds CASCADE;
TRUNCATE TABLE expenses CASCADE;
TRUNCATE TABLE transfers CASCADE;
TRUNCATE TABLE raw_materials CASCADE;
TRUNCATE TABLE workers CASCADE;
TRUNCATE TABLE machines CASCADE;
TRUNCATE TABLE spare_parts_items CASCADE;
TRUNCATE TABLE projects CASCADE;
TRUNCATE TABLE trucks CASCADE;
TRUNCATE TABLE external_debts CASCADE;
TRUNCATE TABLE members CASCADE;
TRUNCATE TABLE holidays CASCADE;
TRUNCATE TABLE app_users CASCADE;
TRUNCATE TABLE operators CASCADE;
TRUNCATE TABLE workshops CASCADE;
TRUNCATE TABLE workshop_expense_categories CASCADE;
TRUNCATE TABLE worker_companies CASCADE;
TRUNCATE TABLE work_shifts CASCADE;
TRUNCATE TABLE factory_settings CASCADE;
TRUNCATE TABLE member_types CASCADE;
TRUNCATE TABLE expense_categories CASCADE;
TRUNCATE TABLE companies CASCADE;

-- ===== companies: 7 rows =====
INSERT INTO companies (id, name, balance, is_parent, debt_to_parent, phone, username, password, whatsapp_api_key) VALUES ('91046a63-bac3-47d6-8e33-b8ef93d03dfb', 'SARL FATRID', '60873005.96', false, '60873005.96', NULL, 'FATRID', '$2b$10$vMzNvcRwozfYILk9yFP0o.Ctl6tVPRPjMJ0tMgnc..Vo48.k7BNgm', NULL) ON CONFLICT DO NOTHING;
INSERT INTO companies (id, name, balance, is_parent, debt_to_parent, phone, username, password, whatsapp_api_key) VALUES ('cac6ad2e-bc6a-4d39-a4a4-a8db8e2cbf69', 'chine', '-278067360.00', false, '-278067360.00', NULL, 'CHINA', '$2b$10$o4gBbZbhK0HCi2yJzjNVgORRZNykah8YnFMvBICiVMBi0WeTumRKq', NULL) ON CONFLICT DO NOTHING;
INSERT INTO companies (id, name, balance, is_parent, debt_to_parent, phone, username, password, whatsapp_api_key) VALUES ('bf82328d-8a6c-4f3c-8374-396caf770fda', 'usine', '-148176270.96', false, '-148176270.96', NULL, 'TPL', '$2b$10$VsgYQSnQyzUfSTGHW4kPauwRWgSt3/ia389RSdQGtKR0eqNaafMru', NULL) ON CONFLICT DO NOTHING;
INSERT INTO companies (id, name, balance, is_parent, debt_to_parent, phone, username, password, whatsapp_api_key) VALUES ('5197612d-8eeb-4183-a5bc-0702e2154dd3', 'bank', '250412000.00', false, '250412000.00', NULL, 'BANK', '$2b$10$Luuq1aKzYp/IChxm7DahmezwpX9Sr9s7tV7RC6T675AS97dggvKam', NULL) ON CONFLICT DO NOTHING;
INSERT INTO companies (id, name, balance, is_parent, debt_to_parent, phone, username, password, whatsapp_api_key) VALUES ('db39e0f7-4f34-46d2-8d43-be42edba51a7', 'الشركة الأم المركزية', '1034500.00', true, '96531245.00', NULL, 'admin', '$2b$10$q/UDCbTywpBGo2GuJ9MyC.j12jVcdhSyR4UYc1gDj/qfS5ZpZxnPq', NULL) ON CONFLICT DO NOTHING;
INSERT INTO companies (id, name, balance, is_parent, debt_to_parent, phone, username, password, whatsapp_api_key) VALUES ('bdf9eb38-4a3e-4a24-acf6-6c671efa7f95', 'MAGAZA ELOUED', '14419718.00', false, '14419718.00', NULL, 'AKRAM', '$2b$10$7NMLseXtbB9NsIFR04W0vOvM3vPzdCaUypXCVHBVT.2YFt6HM/aZ.', NULL) ON CONFLICT DO NOTHING;
INSERT INTO companies (id, name, balance, is_parent, debt_to_parent, phone, username, password, whatsapp_api_key) VALUES ('bf8c26c1-a307-483d-adb7-8eff06da5ac9', 'TPL ALGER', '0.00', false, '0.00', NULL, 'ALGER', '$2b$10$kQUsXIjfdnzIbSncuCjOwuaNIECoVPYubrY1NtjY8TAZFAMJLiuBa', NULL) ON CONFLICT DO NOTHING;

-- ===== expense_categories: 7 rows =====
INSERT INTO expense_categories (id, name) VALUES ('d9cf424d-ac54-4869-919f-447be4b7ad3b', 'مصاريف المصنع') ON CONFLICT DO NOTHING;
INSERT INTO expense_categories (id, name) VALUES ('4d3cd593-aa83-4d63-bd99-e815198a9974', 'مصاريف العمال') ON CONFLICT DO NOTHING;
INSERT INTO expense_categories (id, name) VALUES ('4a1d73fd-df39-40a6-b237-e958e7456e16', 'مصاريف أخرى') ON CONFLICT DO NOTHING;
INSERT INTO expense_categories (id, name) VALUES ('edca0317-a861-4c39-b696-8b45588fa6c3', 'مصاريف المطبخ') ON CONFLICT DO NOTHING;
INSERT INTO expense_categories (id, name) VALUES ('8dff22ad-8f39-4142-9713-428b6be6ea77', 'مصاريف النقل') ON CONFLICT DO NOTHING;
INSERT INTO expense_categories (id, name) VALUES ('caa313c6-94a8-4287-a3dc-d10e0fa54d07', 'قطع الغيار') ON CONFLICT DO NOTHING;
INSERT INTO expense_categories (id, name) VALUES ('30ea9032-3069-45ec-bb0e-d2c827c9b59a', 'المواد الاولية') ON CONFLICT DO NOTHING;

-- ===== member_types: 5 rows =====
INSERT INTO member_types (id, name) VALUES ('a3ff5c14-e438-4990-aa3e-52be7971f225', 'الشركاء') ON CONFLICT DO NOTHING;
INSERT INTO member_types (id, name) VALUES ('beb9a8e9-6e7b-487d-bdde-616af68b9e5a', 'Z100') ON CONFLICT DO NOTHING;
INSERT INTO member_types (id, name) VALUES ('3bfc9f2b-fc66-4ebb-96b1-43037a09dcee', 'CAISSE') ON CONFLICT DO NOTHING;
INSERT INTO member_types (id, name) VALUES ('9d32aa3d-dc6e-4d97-a44b-041d05ca5225', 'LEMKADEM') ON CONFLICT DO NOTHING;
INSERT INTO member_types (id, name) VALUES ('93c6b917-fa61-4a83-8469-7db6a0772aff', 'MASONERIE') ON CONFLICT DO NOTHING;

-- ===== factory_settings: 1 rows =====
INSERT INTO factory_settings (id, balance) VALUES ('ddc83b8e-5df3-493e-a7a9-39c444373ed0', '-16245.00') ON CONFLICT DO NOTHING;

-- work_shifts: 0 rows (skipped)

-- ===== worker_companies: 2 rows =====
INSERT INTO worker_companies (id, name, created_at) VALUES ('55d0ec00-4708-4e39-95f6-d4beb0ada321', 'SARL ALLAL', '2026-02-24T00:04:46.101Z') ON CONFLICT DO NOTHING;
INSERT INTO worker_companies (id, name, created_at) VALUES ('033659e3-c53e-46ba-80dd-8351cc5e4a3d', 'SARL TPL', '2026-02-24T00:04:55.245Z') ON CONFLICT DO NOTHING;

-- ===== workshop_expense_categories: 1 rows =====
INSERT INTO workshop_expense_categories (id, name) VALUES ('f6e3c8bf-d56d-4a24-8699-325ccc965ef9', 'قطع الغيار') ON CONFLICT DO NOTHING;

-- ===== workshops: 1 rows =====
INSERT INTO workshops (id, name, created_at) VALUES ('cdbdc2ee-5cfb-441f-8ea8-0bc49216738d', 'tige felty', '2026-02-21T17:07:10.010Z') ON CONFLICT DO NOTHING;

-- ===== operators: 1 rows =====
INSERT INTO operators (id, name, username, password, created_at) VALUES ('1fc8eaad-4121-478e-8f64-00c3ba4db43a', 'agent2', 'agent2', '$2b$10$udzs7xUY54X.tLIS/z5cC.bFKDHHg20ZNSJF0m/uadNHShDgr7W32', '2026-02-19T19:29:07.117Z') ON CONFLICT DO NOTHING;

-- ===== app_users: 3 rows =====
INSERT INTO app_users (id, username, password, display_name, permissions, is_active, created_at) VALUES ('3fd8e960-dfad-40b7-af13-cbd334df5841', 'salem', '$2b$10$GXmnrdeeoT/xtwRUwM/BjO8l2/0OyWdTEb7jLJFeVXhucD7hj7Xla', 'salem', '{"companies","transfers","expenses","members","external_debts","trucks","external_funds","projects","factory","account_statement"}', true, '2026-02-19T23:59:10.424Z') ON CONFLICT DO NOTHING;
INSERT INTO app_users (id, username, password, display_name, permissions, is_active, created_at) VALUES ('891c8883-cbcd-4ec9-ab51-3fb0cf5c6e48', 'agent2', '$2b$10$KjIhxFFsmAZgswLTl9Hyt.e4qgYHrfCTtyB5uwdZNuOwVHw/W5UGS', 'ahmed', '{"companies","transfers","expenses","members","external_debts","trucks","external_funds","projects","factory"}', true, '2026-02-19T23:57:36.412Z') ON CONFLICT DO NOTHING;
INSERT INTO app_users (id, username, password, display_name, permissions, is_active, created_at) VALUES ('8c9ed49e-9aa2-4bc6-90fa-02c92704c4c0', 'agent4', '$2b$10$qO68tE8YYRfUC/15KlGQeuwfg6jcgHMFVwyFcudstysMOuxxQ572e', 'ss', '{"companies","expenses","factory","transfers","members","trucks","projects","external_debts","external_funds"}', true, '2026-02-23T23:25:22.267Z') ON CONFLICT DO NOTHING;

-- holidays: 0 rows (skipped)

-- ===== members: 11 rows =====
INSERT INTO members (id, name, phone, type_id, balance) VALUES ('ca282aba-65bb-490f-8c4c-8777db15ce41', 'MOSKE', '757670', 'beb9a8e9-6e7b-487d-bdde-616af68b9e5a', '757670.00') ON CONFLICT DO NOTHING;
INSERT INTO members (id, name, phone, type_id, balance) VALUES ('d853f74e-1ff8-4d69-9425-55411e721b3e', 'LEMKADEM', NULL, '9d32aa3d-dc6e-4d97-a44b-041d05ca5225', '12000000.00') ON CONFLICT DO NOTHING;
INSERT INTO members (id, name, phone, type_id, balance) VALUES ('c56eb2ea-c0cc-4762-9028-27079339b3c9', 'HABIB MACONERIE', NULL, '93c6b917-fa61-4a83-8469-7db6a0772aff', '25500000.00') ON CONFLICT DO NOTHING;
INSERT INTO members (id, name, phone, type_id, balance) VALUES ('37bd99e2-05fb-4dee-9e3f-fc04afb36669', 'MOUHAME MACONERIE', NULL, '93c6b917-fa61-4a83-8469-7db6a0772aff', '24000000.00') ON CONFLICT DO NOTHING;
INSERT INTO members (id, name, phone, type_id, balance) VALUES ('95f8012a-2eb5-4e0e-a006-29512ade0e15', 'EL HABIB', '213555053064', 'a3ff5c14-e438-4990-aa3e-52be7971f225', '550000.00') ON CONFLICT DO NOTHING;
INSERT INTO members (id, name, phone, type_id, balance) VALUES ('359ce2a2-9198-4f4c-9f60-741d49861bfd', 'CAISSE', NULL, '3bfc9f2b-fc66-4ebb-96b1-43037a09dcee', '4866717.61') ON CONFLICT DO NOTHING;
INSERT INTO members (id, name, phone, type_id, balance) VALUES ('330cf290-aafe-4394-bfe7-525ba023fbeb', 'Z100', NULL, 'beb9a8e9-6e7b-487d-bdde-616af68b9e5a', '1103270.00') ON CONFLICT DO NOTHING;
INSERT INTO members (id, name, phone, type_id, balance) VALUES ('2b0cd6cc-b364-4f4c-af6e-98c27d6f242c', 'BACHIR', '213555053062', 'a3ff5c14-e438-4990-aa3e-52be7971f225', '7830000.00') ON CONFLICT DO NOTHING;
INSERT INTO members (id, name, phone, type_id, balance) VALUES ('5dff13a8-0192-42c9-9f6f-41b4cfb4921a', 'FATHI', '0555053060', 'a3ff5c14-e438-4990-aa3e-52be7971f225', '2810000.00') ON CONFLICT DO NOTHING;
INSERT INTO members (id, name, phone, type_id, balance) VALUES ('c0b769a9-3a95-4c5a-8dca-756755882749', 'ALI', '0555053063', 'a3ff5c14-e438-4990-aa3e-52be7971f225', '21700000.00') ON CONFLICT DO NOTHING;
INSERT INTO members (id, name, phone, type_id, balance) VALUES ('f06f9abb-0c0a-49ec-a56a-e4ce2d1bd4e5', 'AHMED', '213555053058', 'a3ff5c14-e438-4990-aa3e-52be7971f225', '10250000.00') ON CONFLICT DO NOTHING;

-- ===== external_debts: 31 rows =====
INSERT INTO external_debts (id, person_name, phone, total_amount, paid_amount, note, created_at, date) VALUES ('b02cdfb3-b317-4061-98cb-025f7de30922', 'hamama ayoub', NULL, '60000.00', '0.00', NULL, '2026-02-18T23:26:06.396Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO external_debts (id, person_name, phone, total_amount, paid_amount, note, created_at, date) VALUES ('13b0238c-ad28-4755-9d0a-81bd87ca5a13', 'ABSI MOUHAMMED SALEH', NULL, '250000.00', '0.00', NULL, '2026-02-18T23:26:41.515Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO external_debts (id, person_name, phone, total_amount, paid_amount, note, created_at, date) VALUES ('b51a7159-d5a2-4f5c-913f-99b93ff4670c', 'TEDJANI AHMED DOCTEUR', NULL, '250000.00', '0.00', NULL, '2026-02-18T23:27:10.843Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO external_debts (id, person_name, phone, total_amount, paid_amount, note, created_at, date) VALUES ('35bab27f-53cc-44ba-9f55-4131920c5ad6', 'BENACER YOUSEF', NULL, '500000.00', '0.00', NULL, '2026-02-18T23:27:32.595Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO external_debts (id, person_name, phone, total_amount, paid_amount, note, created_at, date) VALUES ('3a24e41f-fc6a-4731-a387-683a7728d318', 'BOUGUETAYA ZOUHER', NULL, '300000.00', '0.00', NULL, '2026-02-18T23:29:08.027Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO external_debts (id, person_name, phone, total_amount, paid_amount, note, created_at, date) VALUES ('6fafc9c4-e073-499a-a342-8089b942c92a', 'BOUGUETAYA LASAAD', NULL, '200000.00', '0.00', NULL, '2026-02-18T23:29:28.691Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO external_debts (id, person_name, phone, total_amount, paid_amount, note, created_at, date) VALUES ('e4869f17-4108-4bbf-9f12-16df6fef6d4d', 'BELABASI DJABARI', NULL, '50000.00', '0.00', NULL, '2026-02-18T23:29:51.799Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO external_debts (id, person_name, phone, total_amount, paid_amount, note, created_at, date) VALUES ('a0e0af71-1ec0-436e-9268-c5a0d7562063', 'TRANSITEUR ADEL', NULL, '210000.00', '0.00', NULL, '2026-02-18T23:30:19.664Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO external_debts (id, person_name, phone, total_amount, paid_amount, note, created_at, date) VALUES ('8736dbcf-cbc1-40fd-9622-4a97b30fcd83', 'FARES AZEB', NULL, '30000.00', '0.00', NULL, '2026-02-18T23:30:41.231Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO external_debts (id, person_name, phone, total_amount, paid_amount, note, created_at, date) VALUES ('e5656c3d-3421-4126-bdb7-0d5d3ac67ba4', 'AYADI', NULL, '400000.00', '0.00', NULL, '2026-02-18T23:31:04.108Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO external_debts (id, person_name, phone, total_amount, paid_amount, note, created_at, date) VALUES ('f9ecd8e1-394a-411e-a89b-c2ecd66c3813', 'MANSOURI ZOUHER', NULL, '1000000.00', '0.00', NULL, '2026-02-18T23:31:44.436Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO external_debts (id, person_name, phone, total_amount, paid_amount, note, created_at, date) VALUES ('23528b64-642a-435d-9738-dcc437582065', 'AD AHMED', NULL, '610000.00', '0.00', NULL, '2026-02-18T23:32:01.571Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO external_debts (id, person_name, phone, total_amount, paid_amount, note, created_at, date) VALUES ('1942de85-c88a-46f6-9219-aa07d64de8b9', 'HAMAMA SAAD', NULL, '100000.00', '0.00', NULL, '2026-02-18T23:32:18.985Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO external_debts (id, person_name, phone, total_amount, paid_amount, note, created_at, date) VALUES ('55ce0294-9744-4c87-9a22-4bfe64a10964', 'WAKWAK LAID', NULL, '200000.00', '0.00', NULL, '2026-02-18T23:32:40.296Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO external_debts (id, person_name, phone, total_amount, paid_amount, note, created_at, date) VALUES ('5c1bf578-4670-4cd7-aea7-1748427f9299', 'KADOURI BACHIR', NULL, '800000.00', '0.00', NULL, '2026-02-18T23:33:14.932Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO external_debts (id, person_name, phone, total_amount, paid_amount, note, created_at, date) VALUES ('137e021a-638d-4c91-8bc4-78494bf7c361', 'BOUGUETAYA AIZEDINE', NULL, '600000.00', '0.00', NULL, '2026-02-18T23:33:37.620Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO external_debts (id, person_name, phone, total_amount, paid_amount, note, created_at, date) VALUES ('959e64e0-0025-4836-87bb-727b90dbc341', 'KORAICHI KAHLA', NULL, '900000.00', '0.00', NULL, '2026-02-18T23:33:59.838Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO external_debts (id, person_name, phone, total_amount, paid_amount, note, created_at, date) VALUES ('93d4e8b4-7809-475e-a3f0-90014046cabe', 'BEKAKRA BELGASEM', NULL, '150000.00', '0.00', NULL, '2026-02-18T23:34:22.115Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO external_debts (id, person_name, phone, total_amount, paid_amount, note, created_at, date) VALUES ('e56b0697-d0ba-4955-a666-33ade1f6b50b', 'TRIKI ELNAKHLA', NULL, '200000.00', '0.00', NULL, '2026-02-18T23:34:45.580Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO external_debts (id, person_name, phone, total_amount, paid_amount, note, created_at, date) VALUES ('7fdc9857-c719-4ec2-9e9e-30cb6264ce61', 'GHRESSI AHMED', NULL, '300000.00', '0.00', NULL, '2026-02-18T23:35:07.852Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO external_debts (id, person_name, phone, total_amount, paid_amount, note, created_at, date) VALUES ('e371c355-d4d9-417a-a418-d83d004fdfff', 'BOUZENA THAMER', NULL, '50000.00', '0.00', NULL, '2026-02-18T23:35:33.090Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO external_debts (id, person_name, phone, total_amount, paid_amount, note, created_at, date) VALUES ('eb05d0c4-ecbf-4aa9-90da-fc914ecfc28a', 'BEN SASI KHAZANI', NULL, '500000.00', '0.00', NULL, '2026-02-18T23:35:58.721Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO external_debts (id, person_name, phone, total_amount, paid_amount, note, created_at, date) VALUES ('3e3b816e-b0f5-4ddb-95ba-ce87b944496e', 'ATALLA BELGASEM', NULL, '30000.00', '0.00', NULL, '2026-02-18T23:36:27.524Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO external_debts (id, person_name, phone, total_amount, paid_amount, note, created_at, date) VALUES ('d01f7684-2525-427c-a0c4-18ecc45b25fb', 'HAMMAMI KAMEL', NULL, '30000.00', '0.00', NULL, '2026-02-18T23:36:46.237Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO external_debts (id, person_name, phone, total_amount, paid_amount, note, created_at, date) VALUES ('7d1e2c48-911c-4a8e-9bf6-30d49040989f', 'WAKWAK BADER', NULL, '842000.00', '0.00', NULL, '2026-02-18T23:37:09.731Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO external_debts (id, person_name, phone, total_amount, paid_amount, note, created_at, date) VALUES ('6664635e-4d08-4daa-9cce-bb36925e40f6', 'ALI BOUAZIZ', NULL, '300000.00', '0.00', NULL, '2026-02-18T23:37:27.385Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO external_debts (id, person_name, phone, total_amount, paid_amount, note, created_at, date) VALUES ('d4b06d3b-1b66-4271-80c6-48a49b261b63', 'MESSAI MAHMOUD', NULL, '70000.00', '0.00', NULL, '2026-02-18T23:37:44.973Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO external_debts (id, person_name, phone, total_amount, paid_amount, note, created_at, date) VALUES ('f10641d4-d456-4295-94f7-1568ee73aa41', 'KHLAIL ISMAIL', NULL, '1995000.00', '0.00', NULL, '2026-02-18T23:38:08.609Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO external_debts (id, person_name, phone, total_amount, paid_amount, note, created_at, date) VALUES ('5af2f312-0660-42cb-b65f-6b785ed9356d', 'SAMI HMILA', NULL, '2500000.00', '0.00', NULL, '2026-02-18T23:38:24.202Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO external_debts (id, person_name, phone, total_amount, paid_amount, note, created_at, date) VALUES ('afced8bf-4f6d-485c-bace-17d35ae0855c', 'TEDJANI WALID', NULL, '-1800000.00', '0.00', NULL, '2026-02-19T08:40:57.937Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO external_debts (id, person_name, phone, total_amount, paid_amount, note, created_at, date) VALUES ('f16b2752-f69a-4958-8905-56c7e6f71e86', 'WAKWAK ABDELBASET', NULL, '-1500000.00', '0.00', NULL, '2026-02-19T08:41:38.090Z', NULL) ON CONFLICT DO NOTHING;

-- ===== trucks: 2 rows =====
INSERT INTO trucks (id, number, driver_name, balance, fuel_formula, driver_wage, driver_commission_rate) VALUES ('e8533dbd-da6b-4cfb-89d3-23c5e6b17b8c', '2019', 'mouhammed bnengana', '-40000.00', '0.8600', '50000.00', '10.00') ON CONFLICT DO NOTHING;
INSERT INTO trucks (id, number, driver_name, balance, fuel_formula, driver_wage, driver_commission_rate) VALUES ('607dea6c-7677-4556-b082-b426cd001703', '110', 'chabro', '-30000.00', '0.8600', '50000.00', '10.00') ON CONFLICT DO NOTHING;

-- ===== projects: 2 rows =====
INSERT INTO projects (id, name, description, balance, created_at) VALUES ('1e46a80d-d424-4d3e-bade-5f1ec02ecb15', 'الزملة', NULL, '-4000000.00', '2026-02-19T17:19:43.656Z') ON CONFLICT DO NOTHING;
INSERT INTO projects (id, name, description, balance, created_at) VALUES ('39b08764-ed09-4b52-ac9f-41c9c4fdf45d', 'البناء المصنع', NULL, '-919000.00', '2026-02-19T17:20:05.922Z') ON CONFLICT DO NOTHING;

-- ===== spare_parts_items: 2 rows =====
INSERT INTO spare_parts_items (id, name, quantity, unit, created_at) VALUES ('4e7e75ac-8a4d-4a7d-9c31-2b03e739f954', 'ROULMON 12/450', '230.00', 'قطعة', '2026-02-19T15:37:57.310Z') ON CONFLICT DO NOTHING;
INSERT INTO spare_parts_items (id, name, quantity, unit, created_at) VALUES ('55edd951-06b2-4939-91a5-8d142a5d8a9c', 'croi 13x340', '2.00', 'قطعة', '2026-02-19T19:40:17.659Z') ON CONFLICT DO NOTHING;

-- ===== machines: 1 rows =====
INSERT INTO machines (id, workshop_id, name, type, expected_daily_output, unit, created_at) VALUES ('d9f8034a-0e38-49ab-ba90-f79e5e0b2495', 'cdbdc2ee-5cfb-441f-8ea8-0bc49216738d', 'tige 1', 'counter', '3500.00', 'pcs', '2026-02-21T17:07:43.451Z') ON CONFLICT DO NOTHING;

-- ===== workers: 2 rows =====
INSERT INTO workers (id, name, phone, created_at, worker_number, worker_company_id, contract_end_date, wage, work_period, workshop_id, non_renewal_date, balance, overtime_rate, shift_id, bonus) VALUES ('726e312d-2330-4ce7-81ee-638d41e77ff6', 'عتيق السعيد', NULL, '2026-02-19T15:49:49.526Z', NULL, NULL, NULL, '0.00', NULL, NULL, NULL, '0.00', '0.00', NULL, '5000.00') ON CONFLICT DO NOTHING;
INSERT INTO workers (id, name, phone, created_at, worker_number, worker_company_id, contract_end_date, wage, work_period, workshop_id, non_renewal_date, balance, overtime_rate, shift_id, bonus) VALUES ('5ed56c04-34ee-4d41-b81d-ac3e95928b5a', 'BEN AHMED YOUNES', NULL, '2026-02-24T00:06:49.521Z', '112', '55d0ec00-4708-4e39-95f6-d4beb0ada321', NULL, '45000.00', 'مسائي', 'cdbdc2ee-5cfb-441f-8ea8-0bc49216738d', NULL, '0.00', '0.00', NULL, '5000.00') ON CONFLICT DO NOTHING;

-- raw_materials: 0 rows (skipped)

-- ===== transfers: 13 rows =====
INSERT INTO transfers (id, from_company_id, to_company_id, amount, status, note, created_at, date) VALUES ('be813b90-d386-47ed-afdf-bcd9815826bd', '91046a63-bac3-47d6-8e33-b8ef93d03dfb', 'db39e0f7-4f34-46d2-8d43-be42edba51a7', '61812654.00', 'approved', 'REGLAGE ', '2026-02-18T20:05:05.302Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO transfers (id, from_company_id, to_company_id, amount, status, note, created_at, date) VALUES ('c6fd441e-4dfe-4a3f-89ac-ec52e23b2170', 'cac6ad2e-bc6a-4d39-a4a4-a8db8e2cbf69', '91046a63-bac3-47d6-8e33-b8ef93d03dfb', '278067360.00', 'approved', NULL, '2026-02-19T00:01:21.989Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO transfers (id, from_company_id, to_company_id, amount, status, note, created_at, date) VALUES ('39e190af-04ad-40f9-acef-2c1a91643cb4', '91046a63-bac3-47d6-8e33-b8ef93d03dfb', 'db39e0f7-4f34-46d2-8d43-be42edba51a7', '5970766.00', 'approved', NULL, '2026-02-19T00:05:36.761Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO transfers (id, from_company_id, to_company_id, amount, status, note, created_at, date) VALUES ('72e58c4d-d1d4-4bb5-8598-28f607b5774b', '91046a63-bac3-47d6-8e33-b8ef93d03dfb', '5197612d-8eeb-4183-a5bc-0702e2154dd3', '250000000.00', 'approved', NULL, '2026-02-19T00:08:07.208Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO transfers (id, from_company_id, to_company_id, amount, status, note, created_at, date) VALUES ('ff3eff95-42a0-45a4-9259-5c2ad8c6275b', 'bf82328d-8a6c-4f3c-8374-396caf770fda', '91046a63-bac3-47d6-8e33-b8ef93d03dfb', '92059003.96', 'approved', 'boulon', '2026-02-19T00:20:18.869Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO transfers (id, from_company_id, to_company_id, amount, status, note, created_at, date) VALUES ('817a96b7-54e7-476d-9f1a-b8e28b7589ab', 'bf82328d-8a6c-4f3c-8374-396caf770fda', '91046a63-bac3-47d6-8e33-b8ef93d03dfb', '56117267.00', 'approved', 'quincaillerie', '2026-02-19T00:19:28.127Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO transfers (id, from_company_id, to_company_id, amount, status, note, created_at, date) VALUES ('d253f4bf-b998-4d7c-9853-f062738c304a', 'bdf9eb38-4a3e-4a24-acf6-6c671efa7f95', 'db39e0f7-4f34-46d2-8d43-be42edba51a7', '26339360.00', 'approved', 'cach', '2026-02-19T00:23:34.886Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO transfers (id, from_company_id, to_company_id, amount, status, note, created_at, date) VALUES ('a01f4d9f-0d7a-44d3-af50-0e73ea80268a', 'bdf9eb38-4a3e-4a24-acf6-6c671efa7f95', 'db39e0f7-4f34-46d2-8d43-be42edba51a7', '1000227.00', 'approved', 'check', '2026-02-19T00:24:06.988Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO transfers (id, from_company_id, to_company_id, amount, status, note, created_at, date) VALUES ('74b94c07-6141-4215-a294-670dca6e3b3b', '91046a63-bac3-47d6-8e33-b8ef93d03dfb', 'bdf9eb38-4a3e-4a24-acf6-6c671efa7f95', '11129623.00', 'approved', 'boulon', '2026-02-19T00:42:11.873Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO transfers (id, from_company_id, to_company_id, amount, status, note, created_at, date) VALUES ('8bbd4f13-0455-46d4-85ea-ee94c731a5fb', '91046a63-bac3-47d6-8e33-b8ef93d03dfb', 'bdf9eb38-4a3e-4a24-acf6-6c671efa7f95', '33257582.00', 'approved', 'quincaill', '2026-02-19T00:41:26.799Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO transfers (id, from_company_id, to_company_id, amount, status, note, created_at, date) VALUES ('504d7190-f195-4b6d-b312-723e7d4c9caf', 'bdf9eb38-4a3e-4a24-acf6-6c671efa7f95', '5197612d-8eeb-4183-a5bc-0702e2154dd3', '412000.00', 'approved', 'ben moussa zakaria', '2026-02-21T11:32:01.404Z', '2026-02-21') ON CONFLICT DO NOTHING;
INSERT INTO transfers (id, from_company_id, to_company_id, amount, status, note, created_at, date) VALUES ('160d9a7d-91fd-463e-b652-6345bf96d69f', 'bdf9eb38-4a3e-4a24-acf6-6c671efa7f95', 'db39e0f7-4f34-46d2-8d43-be42edba51a7', '2215900.00', 'approved', NULL, '2026-02-21T11:29:20.113Z', '2026-02-21') ON CONFLICT DO NOTHING;
INSERT INTO transfers (id, from_company_id, to_company_id, amount, status, note, created_at, date) VALUES ('431d8e45-2650-4ae5-808f-042af4c466d5', '91046a63-bac3-47d6-8e33-b8ef93d03dfb', 'db39e0f7-4f34-46d2-8d43-be42edba51a7', '3200000.00', 'approved', 'hamza bacouche', '2026-02-21T11:49:48.619Z', '2026-02-21') ON CONFLICT DO NOTHING;

-- ===== expenses: 14 rows =====
INSERT INTO expenses (id, category, amount, description, created_at, date) VALUES ('66ee0cb8-a171-4494-a75a-dc1546d9eb86', 'd9cf424d-ac54-4869-919f-447be4b7ad3b', '12300000.00', 'OLD', '2026-02-18T20:33:23.946Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO expenses (id, category, amount, description, created_at, date) VALUES ('eba6ecfb-2ce6-48a6-ba61-7542629e1979', '4d3cd593-aa83-4d63-bd99-e815198a9974', '10430000.00', 'JANFIE', '2026-02-18T20:36:24.841Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO expenses (id, category, amount, description, created_at, date) VALUES ('9e98d974-235d-4dc1-adce-1e6698aff629', '4d3cd593-aa83-4d63-bd99-e815198a9974', '2820000.00', 'FIFRIE', '2026-02-18T20:36:43.737Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO expenses (id, category, amount, description, created_at, date) VALUES ('1e09a73f-b893-408b-b3d0-9ba3970ae2ed', '4d3cd593-aa83-4d63-bd99-e815198a9974', '4000.00', 'doua', '2026-02-21T12:07:37.732Z', '2026-02-21') ON CONFLICT DO NOTHING;
INSERT INTO expenses (id, category, amount, description, created_at, date) VALUES ('48aad480-13b2-4a6b-be3a-3c85f883d9d0', '4a1d73fd-df39-40a6-b237-e958e7456e16', '285000.00', NULL, '2026-02-21T12:08:02.995Z', '2026-02-21') ON CONFLICT DO NOTHING;
INSERT INTO expenses (id, category, amount, description, created_at, date) VALUES ('19635c68-2712-4ee0-8bd3-bd12997f10bc', '4a1d73fd-df39-40a6-b237-e958e7456e16', '50000.00', NULL, '2026-02-21T12:08:28.386Z', '2026-02-21') ON CONFLICT DO NOTHING;
INSERT INTO expenses (id, category, amount, description, created_at, date) VALUES ('08057931-eadc-4e40-ba2a-782785d85d38', '4d3cd593-aa83-4d63-bd99-e815198a9974', '1000.00', NULL, '2026-02-21T12:09:17.424Z', '2026-02-21') ON CONFLICT DO NOTHING;
INSERT INTO expenses (id, category, amount, description, created_at, date) VALUES ('078713dc-67e5-4d5a-80f4-5138f170350d', '8dff22ad-8f39-4142-9713-428b6be6ea77', '190500.00', NULL, '2026-02-21T12:09:51.757Z', '2026-02-21') ON CONFLICT DO NOTHING;
INSERT INTO expenses (id, category, amount, description, created_at, date) VALUES ('90e4426d-c2dd-47d2-8e65-723467bf6345', '4a1d73fd-df39-40a6-b237-e958e7456e16', '1400000.00', NULL, '2026-02-21T12:10:41.505Z', '2026-02-21') ON CONFLICT DO NOTHING;
INSERT INTO expenses (id, category, amount, description, created_at, date) VALUES ('19da1c6e-84ad-4bfd-8978-70081893351d', '4d3cd593-aa83-4d63-bd99-e815198a9974', '100000.00', 'sapti +gabossa', '2026-02-21T12:16:30.024Z', '2026-02-21') ON CONFLICT DO NOTHING;
INSERT INTO expenses (id, category, amount, description, created_at, date) VALUES ('df1668af-d2fd-4913-baee-d6ac28dce0f7', '4a1d73fd-df39-40a6-b237-e958e7456e16', '5000.00', NULL, '2026-02-21T12:22:56.383Z', '2026-02-21') ON CONFLICT DO NOTHING;
INSERT INTO expenses (id, category, amount, description, created_at, date) VALUES ('eb094153-c84c-47fe-8762-622302a09191', 'edca0317-a861-4c39-b696-8b45588fa6c3', '20000.00', NULL, '2026-02-21T12:24:06.589Z', '2026-02-21') ON CONFLICT DO NOTHING;
INSERT INTO expenses (id, category, amount, description, created_at, date) VALUES ('ef69183f-f86a-4bb2-b37d-1c1b4e54970f', '8dff22ad-8f39-4142-9713-428b6be6ea77', '1300.00', NULL, '2026-02-21T12:24:39.557Z', '2026-02-21') ON CONFLICT DO NOTHING;
INSERT INTO expenses (id, category, amount, description, created_at, date) VALUES ('af79477c-1f83-4a90-8fe1-0f5b1f64a59c', '4d3cd593-aa83-4d63-bd99-e815198a9974', '2540.00', NULL, '2026-02-21T12:25:06.013Z', '2026-02-21') ON CONFLICT DO NOTHING;

-- ===== external_funds: 5 rows =====
INSERT INTO external_funds (id, person_name, phone, amount, type, description, created_at, date) VALUES ('0932909f-2170-4b12-8823-3709568bebc4', 'reglage', NULL, '42873702.00', 'incoming', NULL, '2026-02-21T11:27:42.315Z', '2026-02-21') ON CONFLICT DO NOTHING;
INSERT INTO external_funds (id, person_name, phone, amount, type, description, created_at, date) VALUES ('e5c43ebc-b503-4a66-b030-09c2f1595a3b', 'reglage', NULL, '3650000.00', 'incoming', NULL, '2026-02-21T11:28:23.976Z', '2026-02-21') ON CONFLICT DO NOTHING;
INSERT INTO external_funds (id, person_name, phone, amount, type, description, created_at, date) VALUES ('f86b4d9b-1f51-46b6-b06e-afdf8cacb7d6', 'reglage', NULL, '817.61', 'incoming', NULL, '2026-02-21T11:39:04.198Z', '2026-02-21') ON CONFLICT DO NOTHING;
INSERT INTO external_funds (id, person_name, phone, amount, type, description, created_at, date) VALUES ('3cd7979d-83e6-40a3-a306-00830bfdc317', 'reglage', NULL, '1972840.00', 'incoming', NULL, '2026-02-21T12:33:31.680Z', '2026-02-21') ON CONFLICT DO NOTHING;
INSERT INTO external_funds (id, person_name, phone, amount, type, description, created_at, date) VALUES ('aa4def11-947e-4e5e-8090-a2bdabf497ce', 'reglage', NULL, '20000.00', 'incoming', NULL, '2026-02-21T12:33:50.819Z', '2026-02-21') ON CONFLICT DO NOTHING;

-- ===== member_transfers: 24 rows =====
INSERT INTO member_transfers (id, member_id, amount, note, created_at, date) VALUES ('e11c6d7f-d45f-4d74-82d0-d776e8721ce2', 'ca282aba-65bb-490f-8c4c-8777db15ce41', '757670.00', NULL, '2026-02-18T23:43:05.371Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO member_transfers (id, member_id, amount, note, created_at, date) VALUES ('3ca20403-9941-4663-ad0e-6d1a60fe6724', '330cf290-aafe-4394-bfe7-525ba023fbeb', '603270.00', NULL, '2026-02-18T23:43:22.469Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO member_transfers (id, member_id, amount, note, created_at, date) VALUES ('496b9497-134f-4b58-a1e5-602d79925f2e', 'd853f74e-1ff8-4d69-9425-55411e721b3e', '12000000.00', NULL, '2026-02-18T23:44:53.867Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO member_transfers (id, member_id, amount, note, created_at, date) VALUES ('4d1939d5-6331-4af8-ba59-5330a69b3953', 'c56eb2ea-c0cc-4762-9028-27079339b3c9', '25500000.00', NULL, '2026-02-18T23:47:10.640Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO member_transfers (id, member_id, amount, note, created_at, date) VALUES ('5c3a2318-2e6e-410a-bfb1-f3cdec6f733b', '37bd99e2-05fb-4dee-9e3f-fc04afb36669', '24000000.00', NULL, '2026-02-18T23:47:24.491Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO member_transfers (id, member_id, amount, note, created_at, date) VALUES ('fc471ec4-095c-48ae-9a23-fd97c430c1fb', '95f8012a-2eb5-4e0e-a006-29512ade0e15', '550000.00', NULL, '2026-02-18T23:54:02.684Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO member_transfers (id, member_id, amount, note, created_at, date) VALUES ('99cb307d-e7aa-49b2-850f-690833a485ae', '2b0cd6cc-b364-4f4c-af6e-98c27d6f242c', '7780000.00', NULL, '2026-02-18T23:54:19.898Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO member_transfers (id, member_id, amount, note, created_at, date) VALUES ('1b3eee9d-e77f-46d3-84b9-55b9a4328478', 'f06f9abb-0c0a-49ec-a56a-e4ce2d1bd4e5', '10130000.00', NULL, '2026-02-18T23:54:46.529Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO member_transfers (id, member_id, amount, note, created_at, date) VALUES ('837aace4-d53c-4a2c-bc70-54f5cb0b17ac', 'c0b769a9-3a95-4c5a-8dca-756755882749', '20770000.00', NULL, '2026-02-18T23:55:03.277Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO member_transfers (id, member_id, amount, note, created_at, date) VALUES ('92dde6e7-3f43-4402-bbb3-5a9432919eca', '5dff13a8-0192-42c9-9f6f-41b4cfb4921a', '2300000.00', NULL, '2026-02-18T23:55:18.739Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO member_transfers (id, member_id, amount, note, created_at, date) VALUES ('fd832ed3-dfe6-4aad-8ebd-3c763be87d6f', '359ce2a2-9198-4f4c-9f60-741d49861bfd', '5865900.00', NULL, '2026-02-21T11:34:33.472Z', '2026-02-21') ON CONFLICT DO NOTHING;
INSERT INTO member_transfers (id, member_id, amount, note, created_at, date) VALUES ('4e1596a3-32c8-44b4-93e8-f47155613ef2', '359ce2a2-9198-4f4c-9f60-741d49861bfd', '-2700000.00', NULL, '2026-02-21T11:35:21.245Z', '2026-02-21') ON CONFLICT DO NOTHING;
INSERT INTO member_transfers (id, member_id, amount, note, created_at, date) VALUES ('519d22c7-5080-4d8a-826a-4bd04e455279', '359ce2a2-9198-4f4c-9f60-741d49861bfd', '817.61', NULL, '2026-02-21T11:40:16.493Z', '2026-02-21') ON CONFLICT DO NOTHING;
INSERT INTO member_transfers (id, member_id, amount, note, created_at, date) VALUES ('52caecf2-8452-4f02-a763-c8e9bd25ff74', '359ce2a2-9198-4f4c-9f60-741d49861bfd', '2200000.00', NULL, '2026-02-21T11:47:53.730Z', '2026-02-21') ON CONFLICT DO NOTHING;
INSERT INTO member_transfers (id, member_id, amount, note, created_at, date) VALUES ('19db8107-00b5-4d5b-b2c7-6aef03f423b3', '359ce2a2-9198-4f4c-9f60-741d49861bfd', '-500000.00', NULL, '2026-02-21T11:51:13.035Z', '2026-02-21') ON CONFLICT DO NOTHING;
INSERT INTO member_transfers (id, member_id, amount, note, created_at, date) VALUES ('2c198a96-f796-48e5-ab75-fc1c0e1dacfe', '330cf290-aafe-4394-bfe7-525ba023fbeb', '500000.00', NULL, '2026-02-21T11:51:44.932Z', '2026-02-21') ON CONFLICT DO NOTHING;
INSERT INTO member_transfers (id, member_id, amount, note, created_at, date) VALUES ('65d4b8d4-0e24-4c2a-8ede-b5c423ab2e43', 'c0b769a9-3a95-4c5a-8dca-756755882749', '830000.00', 'souhail', '2026-02-21T12:13:59.194Z', '2026-02-21') ON CONFLICT DO NOTHING;
INSERT INTO member_transfers (id, member_id, amount, note, created_at, date) VALUES ('d8c17743-d24a-402e-8330-368b8abbabd2', '5dff13a8-0192-42c9-9f6f-41b4cfb4921a', '300000.00', NULL, '2026-02-21T12:14:11.680Z', '2026-02-21') ON CONFLICT DO NOTHING;
INSERT INTO member_transfers (id, member_id, amount, note, created_at, date) VALUES ('0fb1343e-cd69-4f34-954a-0d34add7daad', 'f06f9abb-0c0a-49ec-a56a-e4ce2d1bd4e5', '50000.00', NULL, '2026-02-21T12:14:32.585Z', '2026-02-21') ON CONFLICT DO NOTHING;
INSERT INTO member_transfers (id, member_id, amount, note, created_at, date) VALUES ('15f02b7c-e826-42f3-81a0-74335a073c99', '2b0cd6cc-b364-4f4c-af6e-98c27d6f242c', '50000.00', NULL, '2026-02-21T12:14:49.894Z', '2026-02-21') ON CONFLICT DO NOTHING;
INSERT INTO member_transfers (id, member_id, amount, note, created_at, date) VALUES ('c5c0e8fa-a35d-43a8-abfd-7f3d88e9cb32', '5dff13a8-0192-42c9-9f6f-41b4cfb4921a', '200000.00', NULL, '2026-02-21T12:15:01.002Z', '2026-02-21') ON CONFLICT DO NOTHING;
INSERT INTO member_transfers (id, member_id, amount, note, created_at, date) VALUES ('6b3f7370-f69e-4eea-9cf8-df69036c6197', '5dff13a8-0192-42c9-9f6f-41b4cfb4921a', '10000.00', 'aymen', '2026-02-21T12:17:04.201Z', '2026-02-21') ON CONFLICT DO NOTHING;
INSERT INTO member_transfers (id, member_id, amount, note, created_at, date) VALUES ('18b66a63-b681-4f1a-a13a-fe470cf4d32f', 'c0b769a9-3a95-4c5a-8dca-756755882749', '100000.00', NULL, '2026-02-21T12:17:47.310Z', '2026-02-21') ON CONFLICT DO NOTHING;
INSERT INTO member_transfers (id, member_id, amount, note, created_at, date) VALUES ('a8a62702-773a-4588-ae9a-d0295c2efe73', 'f06f9abb-0c0a-49ec-a56a-e4ce2d1bd4e5', '70000.00', NULL, '2026-02-21T12:18:29.730Z', '2026-02-21') ON CONFLICT DO NOTHING;

-- debt_payments: 0 rows (skipped)

-- truck_expenses: 0 rows (skipped)

-- ===== truck_trips: 2 rows =====
INSERT INTO truck_trips (id, truck_id, departure_location, arrival_location, fuel_expense, food_expense, spare_parts_expense, old_odometer, new_odometer, trip_fare, expected_fuel, net_result, created_at, driver_wage_entry, commission_entry, date) VALUES ('2dd00c1f-2cad-4799-93f8-9cb14ec41eab', 'e8533dbd-da6b-4cfb-89d3-23c5e6b17b8c', 'eloued ', 'djelfa', '0.00', '40000.00', '0.00', '0.00', '0.00', '0.00', '0.00', '-40000.00', '2026-02-21T12:12:39.722Z', '0.00', '0.00', '2026-02-21') ON CONFLICT DO NOTHING;
INSERT INTO truck_trips (id, truck_id, departure_location, arrival_location, fuel_expense, food_expense, spare_parts_expense, old_odometer, new_odometer, trip_fare, expected_fuel, net_result, created_at, driver_wage_entry, commission_entry, date) VALUES ('ac532589-c9a0-450c-b8bf-c27652dc56bc', '607dea6c-7677-4556-b082-b426cd001703', 'el oued', 'el eulma', '0.00', '30000.00', '0.00', '60843.00', '0.00', '0.00', '0.00', '-30000.00', '2026-02-21T12:28:13.652Z', '0.00', '0.00', '2026-02-20') ON CONFLICT DO NOTHING;

-- ===== project_transactions: 2 rows =====
INSERT INTO project_transactions (id, project_id, amount, type, description, created_at, date) VALUES ('fb2360ed-f779-42f7-b021-5691d8c11fa4', '1e46a80d-d424-4d3e-bade-5f1ec02ecb15', '4000000.00', 'expense', NULL, '2026-02-19T17:24:23.885Z', '2026-02-19') ON CONFLICT DO NOTHING;
INSERT INTO project_transactions (id, project_id, amount, type, description, created_at, date) VALUES ('256bda77-6e99-4df4-9e1a-56ea608bf411', '39b08764-ed09-4b52-ac9f-41c9c4fdf45d', '919000.00', 'expense', NULL, '2026-02-21T12:19:34.848Z', '2026-02-21') ON CONFLICT DO NOTHING;

-- ===== spare_parts_purchases: 8 rows =====
INSERT INTO spare_parts_purchases (id, spare_part_id, quantity, cost, date, created_at) VALUES ('268cf203-ab9e-4c59-9fb3-2b43de29b81a', '4e7e75ac-8a4d-4a7d-9c31-2b03e739f954', '1.00', '325.00', '2026-02-19', '2026-02-19T15:38:20.453Z') ON CONFLICT DO NOTHING;
INSERT INTO spare_parts_purchases (id, spare_part_id, quantity, cost, date, created_at) VALUES ('16746984-8ee3-44ac-96fb-af4127e5df4f', '4e7e75ac-8a4d-4a7d-9c31-2b03e739f954', '2.00', '32.00', '2026-02-19', '2026-02-19T15:54:19.133Z') ON CONFLICT DO NOTHING;
INSERT INTO spare_parts_purchases (id, spare_part_id, quantity, cost, date, created_at) VALUES ('ed3bda6e-19fe-4210-b63c-9fddc0f5e737', '4e7e75ac-8a4d-4a7d-9c31-2b03e739f954', '3.00', '45.00', '2026-02-19', '2026-02-19T16:50:11.252Z') ON CONFLICT DO NOTHING;
INSERT INTO spare_parts_purchases (id, spare_part_id, quantity, cost, date, created_at) VALUES ('52b73956-56d7-4e24-b9e8-699b0d8378cc', '4e7e75ac-8a4d-4a7d-9c31-2b03e739f954', '100.00', '3200.00', '2026-02-19', '2026-02-19T17:13:12.679Z') ON CONFLICT DO NOTHING;
INSERT INTO spare_parts_purchases (id, spare_part_id, quantity, cost, date, created_at) VALUES ('43393695-7649-4445-b8f6-cd295e0ac52a', '4e7e75ac-8a4d-4a7d-9c31-2b03e739f954', '100.00', '5000.00', '2026-02-19', '2026-02-19T17:14:52.391Z') ON CONFLICT DO NOTHING;
INSERT INTO spare_parts_purchases (id, spare_part_id, quantity, cost, date, created_at) VALUES ('7eb1d4ef-47f1-4512-b79f-23eedd465fc6', '4e7e75ac-8a4d-4a7d-9c31-2b03e739f954', '10.00', '3500.00', '2026-02-19', '2026-02-19T18:42:10.685Z') ON CONFLICT DO NOTHING;
INSERT INTO spare_parts_purchases (id, spare_part_id, quantity, cost, date, created_at) VALUES ('e2d346d6-d04a-478c-98b0-b31024285e7c', '4e7e75ac-8a4d-4a7d-9c31-2b03e739f954', '15.00', '2000.00', '2026-02-19', '2026-02-19T18:43:43.819Z') ON CONFLICT DO NOTHING;
INSERT INTO spare_parts_purchases (id, spare_part_id, quantity, cost, date, created_at) VALUES ('96ee2f9c-6990-4c2f-bf24-a8cb7ed2c4ab', '55edd951-06b2-4939-91a5-8d142a5d8a9c', '2.00', '2500.00', '2026-02-19', '2026-02-19T19:40:35.301Z') ON CONFLICT DO NOTHING;

-- spare_parts_consumption: 0 rows (skipped)

-- raw_material_purchases: 0 rows (skipped)

-- machine_daily_entries: 0 rows (skipped)

-- worker_transactions: 0 rows (skipped)

-- worker_warnings: 0 rows (skipped)

-- ===== attendance_days: 1 rows =====
INSERT INTO attendance_days (id, worker_id, date, check_in, check_out, status, late_minutes, early_leave_minutes, overtime_minutes, shift_id, created_at) VALUES ('112226be-2151-431d-ba10-321258c0d509', '726e312d-2330-4ce7-81ee-638d41e77ff6', '2026-02-25', '00:01', NULL, 'present', 0, 0, 0, NULL, '2026-02-25T00:01:07.113Z') ON CONFLICT DO NOTHING;

-- ===== attendance_scans: 1 rows =====
INSERT INTO attendance_scans (id, worker_id, scan_time, type, created_at) VALUES ('ebefd23c-917e-4c3d-932f-2d1405b21918', '726e312d-2330-4ce7-81ee-638d41e77ff6', '2026-02-25T00:01:06.998Z', 'in', '2026-02-25T00:01:07.062Z') ON CONFLICT DO NOTHING;

-- workshop_expenses: 0 rows (skipped)

-- sessions: 0 rows (skipped)

