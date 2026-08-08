ALTER TABLE hospitals
ADD COLUMN IF NOT EXISTS dmho_certificate_path VARCHAR(1024);

ALTER TABLE doctors
ADD COLUMN IF NOT EXISTS medical_council_registration_number VARCHAR(255);
