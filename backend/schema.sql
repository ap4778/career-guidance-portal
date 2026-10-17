CREATE DATABASE IF NOT EXISTS career_guidance_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE career_guidance_db;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student', 'admin') NOT NULL DEFAULT 'student',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role_active (role, is_active)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
  education_level VARCHAR(100) NULL,
  experience_level ENUM('Entry', 'Mid', 'Senior') NOT NULL DEFAULT 'Entry',
  qualifications TEXT NULL,
  preferred_career_id BIGINT UNSIGNED NULL,
  preferred_location VARCHAR(160) NULL,
  profile_completion TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_profiles_preferred_career (preferred_career_id),
  INDEX idx_profiles_location (preferred_location)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS skills (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_skills (
  user_id BIGINT UNSIGNED NOT NULL,
  skill_id BIGINT UNSIGNED NOT NULL,
  proficiency ENUM('beginner', 'intermediate', 'advanced') NOT NULL DEFAULT 'beginner',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, skill_id),
  CONSTRAINT fk_user_skills_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_skills_skill FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS careers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(150) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  salary_range VARCHAR(100) NOT NULL DEFAULT 'Varies by location and experience',
  growth_outlook VARCHAR(100) NOT NULL DEFAULT 'Varies',
  experience_levels JSON NOT NULL,
  interests JSON NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_careers_active_category (is_active, category)
) ENGINE=InnoDB;

SET @profiles_career_fk_exists = (
  SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'fk_profiles_career'
);
SET @profiles_career_fk_sql = IF(
  @profiles_career_fk_exists = 0,
  'ALTER TABLE user_profiles ADD CONSTRAINT fk_profiles_career FOREIGN KEY (preferred_career_id) REFERENCES careers(id) ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE profiles_career_fk_stmt FROM @profiles_career_fk_sql;
EXECUTE profiles_career_fk_stmt;
DEALLOCATE PREPARE profiles_career_fk_stmt;

CREATE TABLE IF NOT EXISTS career_skills (
  career_id BIGINT UNSIGNED NOT NULL,
  skill_id BIGINT UNSIGNED NOT NULL,
  weight DECIMAL(5,2) NOT NULL DEFAULT 1,
  PRIMARY KEY (career_id, skill_id),
  CONSTRAINT fk_career_skills_career FOREIGN KEY (career_id) REFERENCES careers(id) ON DELETE CASCADE,
  CONSTRAINT fk_career_skills_skill FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_interests (
  user_id BIGINT UNSIGNED NOT NULL,
  interest VARCHAR(100) NOT NULL,
  PRIMARY KEY (user_id, interest),
  CONSTRAINT fk_user_interests_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS career_assessments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  inputs JSON NOT NULL,
  recommendations JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_assessments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_assessments_user_created (user_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS jobs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  company VARCHAR(180) NOT NULL,
  location VARCHAR(180) NOT NULL,
  job_type ENUM('Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary') NOT NULL,
  work_mode ENUM('On-site', 'Hybrid', 'Remote') NOT NULL DEFAULT 'On-site',
  salary_range VARCHAR(100) NULL,
  description TEXT NOT NULL,
  career_id BIGINT UNSIGNED NULL,
  application_deadline DATE NULL,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_jobs_career FOREIGN KEY (career_id) REFERENCES careers(id) ON DELETE SET NULL,
  CONSTRAINT fk_jobs_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_jobs_active_created (is_active, created_at),
  INDEX idx_jobs_title (title),
  INDEX idx_jobs_location (location),
  INDEX idx_jobs_type_mode (job_type, work_mode),
  FULLTEXT INDEX idx_jobs_search (title, company, description)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS job_skills (
  job_id BIGINT UNSIGNED NOT NULL,
  skill_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (job_id, skill_id),
  CONSTRAINT fk_job_skills_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  CONSTRAINT fk_job_skills_skill FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS saved_jobs (
  user_id BIGINT UNSIGNED NOT NULL,
  job_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, job_id),
  CONSTRAINT fk_saved_jobs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_saved_jobs_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  INDEX idx_saved_jobs_created (user_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS applications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  job_id BIGINT UNSIGNED NOT NULL,
  status ENUM('Applied', 'Under Review', 'Shortlisted', 'Rejected', 'Selected') NOT NULL DEFAULT 'Applied',
  cover_letter TEXT NULL,
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_applications_user_job UNIQUE (user_id, job_id),
  CONSTRAINT fk_applications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_applications_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  INDEX idx_applications_status_created (status, applied_at),
  INDEX idx_applications_user_created (user_id, applied_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS resumes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(120) NOT NULL DEFAULT 'My resume',
  content JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_resumes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_resumes_user_updated (user_id, updated_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS learning_roadmaps (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  career_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_roadmaps_career FOREIGN KEY (career_id) REFERENCES careers(id) ON DELETE CASCADE,
  INDEX idx_roadmaps_career (career_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS roadmap_steps (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  roadmap_id BIGINT UNSIGNED NOT NULL,
  phase ENUM('Beginner', 'Intermediate', 'Advanced') NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT NULL,
  duration VARCHAR(80) NULL,
  resource_url VARCHAR(500) NULL,
  position SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  CONSTRAINT fk_steps_roadmap FOREIGN KEY (roadmap_id) REFERENCES learning_roadmaps(id) ON DELETE CASCADE,
  INDEX idx_steps_roadmap_position (roadmap_id, position)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_roadmap_progress (
  user_id BIGINT UNSIGNED NOT NULL,
  step_id BIGINT UNSIGNED NOT NULL,
  is_complete BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMP NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, step_id),
  CONSTRAINT fk_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_progress_step FOREIGN KEY (step_id) REFERENCES roadmap_steps(id) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT IGNORE INTO skills (name) VALUES
('JavaScript'), ('React'), ('HTML'), ('CSS'), ('Git'), ('SQL'), ('Node.js'),
('REST APIs'), ('Docker'), ('Python'), ('Statistics'), ('Machine Learning'),
('Pandas'), ('Excel'), ('Tableau'), ('Data Visualization'), ('Figma'),
('Wireframing'), ('Prototyping'), ('User Research'), ('Communication'),
('Cybersecurity'), ('Linux'), ('Networking'), ('Problem Solving'), ('Agile'),
('AWS'), ('Testing'), ('Java'), ('TypeScript'), ('Express'), ('PostgreSQL'),
('Power BI'), ('Accessibility'), ('HTTP'), ('Security principles');

INSERT IGNORE INTO careers (slug, title, category, description, salary_range, growth_outlook, experience_levels, interests) VALUES
('frontend', 'Frontend Developer', 'Development', 'Build accessible, polished user interfaces for the web.', '$70k–$130k (illustrative)', 'Much faster than average', JSON_ARRAY('Entry','Mid','Senior'), JSON_ARRAY('Building products','Design','Problem solving')),
('data-analyst', 'Data Analyst', 'Data', 'Turn data into clear insights that help teams make decisions.', '$65k–$115k (illustrative)', 'Faster than average', JSON_ARRAY('Entry','Mid','Senior'), JSON_ARRAY('Analyzing data','Business','Problem solving')),
('data-scientist', 'Data Scientist', 'Data', 'Use statistics and machine learning to answer complex questions.', '$95k–$165k (illustrative)', 'Much faster than average', JSON_ARRAY('Mid','Senior'), JSON_ARRAY('Analyzing data','Research','Problem solving')),
('backend', 'Backend Developer', 'Development', 'Design reliable server-side software, services and APIs.', '$80k–$145k (illustrative)', 'Faster than average', JSON_ARRAY('Entry','Mid','Senior'), JSON_ARRAY('Building products','Problem solving','Systems')),
('uiux', 'UI/UX Designer', 'Design', 'Research user needs and shape intuitive digital experiences.', '$70k–$125k (illustrative)', 'Average', JSON_ARRAY('Entry','Mid','Senior'), JSON_ARRAY('Design','Building products','People')),
('cybersecurity', 'Cybersecurity Analyst', 'Security', 'Protect systems and data by finding and responding to threats.', '$80k–$145k (illustrative)', 'Much faster than average', JSON_ARRAY('Entry','Mid','Senior'), JSON_ARRAY('Systems','Research','Problem solving')),
('product-manager', 'Product Manager', 'Product', 'Align customer needs, business goals and product delivery.', '$90k–$160k (illustrative)', 'Faster than average', JSON_ARRAY('Mid','Senior'), JSON_ARRAY('Business','People','Building products')),
('devops', 'DevOps Engineer', 'Development', 'Automate infrastructure and make software delivery dependable.', '$95k–$160k (illustrative)', 'Much faster than average', JSON_ARRAY('Mid','Senior'), JSON_ARRAY('Systems','Building products','Problem solving')),
('mobile', 'Mobile App Developer', 'Development', 'Create fast, engaging applications for phones and tablets.', '$75k–$135k (illustrative)', 'Faster than average', JSON_ARRAY('Entry','Mid','Senior'), JSON_ARRAY('Building products','Design','Problem solving')),
('qa', 'QA Automation Engineer', 'Quality', 'Build automated tests that keep software reliable and easy to change.', '$70k–$125k (illustrative)', 'Average', JSON_ARRAY('Entry','Mid','Senior'), JSON_ARRAY('Problem solving','Building products','Systems')),
('cloud', 'Cloud Engineer', 'Infrastructure', 'Build and operate scalable cloud infrastructure.', '$95k–$155k (illustrative)', 'Much faster than average', JSON_ARRAY('Mid','Senior'), JSON_ARRAY('Systems','Building products','Problem solving'));

INSERT IGNORE INTO career_skills (career_id, skill_id, weight)
SELECT c.id, s.id, CASE WHEN s.name IN ('JavaScript','React','SQL','Python','Figma','Cybersecurity','AWS','Docker','Testing') THEN 1.0 ELSE 0.7 END
FROM careers c JOIN skills s ON
  (c.slug = 'frontend' AND s.name IN ('JavaScript','React','HTML','CSS','Git')) OR
  (c.slug = 'data-analyst' AND s.name IN ('SQL','Excel','Statistics','Tableau','Data Visualization')) OR
  (c.slug = 'data-scientist' AND s.name IN ('Python','Statistics','Machine Learning','Pandas','SQL')) OR
  (c.slug = 'backend' AND s.name IN ('Node.js','REST APIs','SQL','Docker','Git')) OR
  (c.slug = 'uiux' AND s.name IN ('Figma','Wireframing','Prototyping','User Research','Communication')) OR
  (c.slug = 'cybersecurity' AND s.name IN ('Cybersecurity','Linux','Networking','Python','Problem Solving')) OR
  (c.slug = 'product-manager' AND s.name IN ('Agile','Communication','User Research','Data Visualization','Problem Solving')) OR
  (c.slug = 'devops' AND s.name IN ('Docker','AWS','Linux','Git','Python')) OR
  (c.slug = 'mobile' AND s.name IN ('JavaScript','React','Java','REST APIs','Git')) OR
  (c.slug = 'qa' AND s.name IN ('Testing','JavaScript','Python','Git','Problem Solving')) OR
  (c.slug = 'cloud' AND s.name IN ('AWS','Linux','Docker','Networking','Python'));

INSERT INTO learning_roadmaps (career_id, title, description)
SELECT id, CONCAT(title, ' learning roadmap'), 'Seeded demo learning roadmap. Choose resources appropriate to your goals.'
FROM careers WHERE slug IN ('frontend','data-analyst','data-scientist','backend','uiux','cybersecurity')
AND NOT EXISTS (SELECT 1 FROM learning_roadmaps r WHERE r.career_id = careers.id);

INSERT INTO roadmap_steps (roadmap_id, phase, title, description, duration, resource_url, position)
SELECT r.id, x.phase, x.title, 'Example learning step; choose a current resource that fits your goals.', x.duration, 'https://www.freecodecamp.org/', x.position
FROM learning_roadmaps r
JOIN careers c ON c.id = r.career_id
JOIN (
  SELECT 'frontend' slug,'Beginner' phase,'HTML and semantic structure' title,'1–2 weeks' duration,1 position UNION ALL
  SELECT 'frontend','Beginner','CSS fundamentals and responsive layouts','1–2 weeks',2 UNION ALL
  SELECT 'frontend','Beginner','JavaScript essentials','1–2 weeks',3 UNION ALL
  SELECT 'frontend','Intermediate','React components and state','2–3 weeks',4 UNION ALL
  SELECT 'frontend','Intermediate','Git and collaborative workflows','2–3 weeks',5 UNION ALL
  SELECT 'frontend','Advanced','TypeScript and scalable architecture','2–4 weeks',6 UNION ALL
  SELECT 'data-analyst','Beginner','Excel and spreadsheet analysis','1–2 weeks',1 UNION ALL
  SELECT 'data-analyst','Beginner','SQL queries and data cleaning','1–2 weeks',2 UNION ALL
  SELECT 'data-analyst','Intermediate','Dashboard design with Tableau or Power BI','2–3 weeks',3 UNION ALL
  SELECT 'data-analyst','Advanced','Complete an end-to-end analysis project','2–4 weeks',4 UNION ALL
  SELECT 'data-scientist','Beginner','Python programming','1–2 weeks',1 UNION ALL
  SELECT 'data-scientist','Beginner','Statistics and probability','1–2 weeks',2 UNION ALL
  SELECT 'data-scientist','Intermediate','Supervised machine learning','2–3 weeks',3 UNION ALL
  SELECT 'data-scientist','Advanced','Publish a reproducible capstone','2–4 weeks',4 UNION ALL
  SELECT 'backend','Beginner','HTTP and REST concepts','1–2 weeks',1 UNION ALL
  SELECT 'backend','Beginner','Relational database basics','1–2 weeks',2 UNION ALL
  SELECT 'backend','Intermediate','Build APIs with Node.js and Express','2–3 weeks',3 UNION ALL
  SELECT 'backend','Advanced','Docker and deployment basics','2–4 weeks',4 UNION ALL
  SELECT 'uiux','Beginner','Design principles and visual hierarchy','1–2 weeks',1 UNION ALL
  SELECT 'uiux','Beginner','User research foundations','1–2 weeks',2 UNION ALL
  SELECT 'uiux','Intermediate','Figma components and prototyping','2–3 weeks',3 UNION ALL
  SELECT 'uiux','Advanced','Complete a portfolio case study','2–4 weeks',4 UNION ALL
  SELECT 'cybersecurity','Beginner','Networking fundamentals','1–2 weeks',1 UNION ALL
  SELECT 'cybersecurity','Beginner','Linux command line','1–2 weeks',2 UNION ALL
  SELECT 'cybersecurity','Intermediate','Log analysis and incident response','2–3 weeks',3 UNION ALL
  SELECT 'cybersecurity','Advanced','Document a defensive lab project','2–4 weeks',4
) x ON x.slug = c.slug
WHERE NOT EXISTS (SELECT 1 FROM roadmap_steps s WHERE s.roadmap_id = r.id AND s.position = x.position);

UPDATE jobs
SET company = CASE title
    WHEN 'Frontend Engineer' THEN 'Northwind Labs'
    WHEN 'Junior React Developer' THEN 'Paperplane'
    WHEN 'Data Analyst' THEN 'Kiln Health'
    WHEN 'Product Data Analyst' THEN 'Fieldnote'
    WHEN 'Machine Learning Scientist' THEN 'Openlane Research'
    WHEN 'Backend Engineer' THEN 'Copperline Systems'
    WHEN 'API Developer' THEN 'Cedar & Finch'
    WHEN 'Product Designer' THEN 'Daybreak Studio'
    WHEN 'Security Operations Analyst' THEN 'Beacon Ridge Security'
    WHEN 'Associate Product Manager' THEN 'Lattice Works'
    WHEN 'DevOps Engineer' THEN 'Branchline Cloud'
    WHEN 'Mobile App Developer' THEN 'Pocket Garden'
    WHEN 'QA Automation Engineer' THEN 'Acorn Quality'
    WHEN 'Cloud Infrastructure Engineer' THEN 'Atlas Cloud'
  END,
  salary_range = CASE title
    WHEN 'Frontend Engineer' THEN '$85,000–$120,000'
    WHEN 'Junior React Developer' THEN '$65,000–$90,000'
    WHEN 'Data Analyst' THEN '$70,000–$95,000'
    WHEN 'Product Data Analyst' THEN '$80,000–$110,000'
    WHEN 'Machine Learning Scientist' THEN '$130,000–$175,000'
    WHEN 'Backend Engineer' THEN '$105,000–$150,000'
    WHEN 'API Developer' THEN '$90,000–$125,000'
    WHEN 'Product Designer' THEN '$90,000–$130,000'
    WHEN 'Security Operations Analyst' THEN '$85,000–$120,000'
    WHEN 'Associate Product Manager' THEN '$95,000–$130,000'
    WHEN 'DevOps Engineer' THEN '$115,000–$160,000'
    WHEN 'Mobile App Developer' THEN '$90,000–$130,000'
    WHEN 'QA Automation Engineer' THEN '$80,000–$115,000'
    WHEN 'Cloud Infrastructure Engineer' THEN '$110,000–$155,000'
  END,
  description = CASE title
    WHEN 'Frontend Engineer' THEN 'Build accessible product interfaces with a small team working across design and engineering.'
    WHEN 'Junior React Developer' THEN 'Help ship customer-facing features and improve the everyday experience of a growing web product.'
    WHEN 'Data Analyst' THEN 'Work with product and operations teams to turn business questions into clear reporting.'
    WHEN 'Product Data Analyst' THEN 'Define product metrics, investigate user behavior and share findings with product teams.'
    WHEN 'Machine Learning Scientist' THEN 'Develop and evaluate models that support search and recommendations.'
    WHEN 'Backend Engineer' THEN 'Design reliable APIs and services for a collaborative software team.'
    WHEN 'API Developer' THEN 'Build integrations and maintain API services used by customer-facing applications.'
    WHEN 'Product Designer' THEN 'Research user needs and design clear workflows for a digital product.'
    WHEN 'Security Operations Analyst' THEN 'Review security alerts, investigate incidents and improve monitoring practices.'
    WHEN 'Associate Product Manager' THEN 'Coordinate product discovery and delivery with design, engineering and support teams.'
    WHEN 'DevOps Engineer' THEN 'Improve cloud deployments, infrastructure automation and service reliability.'
    WHEN 'Mobile App Developer' THEN 'Build and maintain mobile features for a consumer application.'
    WHEN 'QA Automation Engineer' THEN 'Develop automated tests and work with engineers to prevent regressions.'
    WHEN 'Cloud Infrastructure Engineer' THEN 'Design secure cloud infrastructure and improve deployment tooling.'
  END,
  created_at = DATE_SUB(CURRENT_TIMESTAMP, INTERVAL (MOD(id, 14) + 1) DAY),
  is_demo = TRUE
WHERE company LIKE 'Sample Company %'
  AND title IN ('Frontend Engineer', 'Junior React Developer', 'Data Analyst', 'Product Data Analyst',
    'Machine Learning Scientist', 'Backend Engineer', 'API Developer', 'Product Designer',
    'Security Operations Analyst', 'Associate Product Manager', 'DevOps Engineer',
    'Mobile App Developer', 'QA Automation Engineer', 'Cloud Infrastructure Engineer');

INSERT INTO jobs (title, company, location, job_type, work_mode, salary_range, description, career_id, is_demo, is_active, application_deadline, created_at)
SELECT x.title, x.company, x.location, x.job_type, x.work_mode, x.salary_range,
  x.description, c.id, TRUE, TRUE, DATE_ADD(CURRENT_DATE, INTERVAL 90 DAY),
  DATE_SUB(CURRENT_TIMESTAMP, INTERVAL x.posted_days DAY)
FROM (
  SELECT 'Frontend Engineer' title,'Northwind Labs' company,'New York, NY' location,'Full-time' job_type,'Hybrid' work_mode,'$85,000–$120,000' salary_range,'Build accessible product interfaces with a small team working across design and engineering.' description,3 posted_days,'frontend' career_slug UNION ALL
  SELECT 'Junior React Developer','Paperplane','Remote','Full-time','Remote','$65,000–$90,000','Help ship customer-facing features and improve the everyday experience of a growing web product.',1,'frontend' UNION ALL
  SELECT 'Data Analyst','Kiln Health','Chicago, IL','Full-time','On-site','$70,000–$95,000','Work with product and operations teams to turn business questions into clear reporting.',2,'data-analyst' UNION ALL
  SELECT 'Product Data Analyst','Fieldnote','Remote','Full-time','Remote','$80,000–$110,000','Define product metrics, investigate user behavior and share findings with product teams.',4,'data-analyst' UNION ALL
  SELECT 'Machine Learning Scientist','Openlane Research','San Francisco, CA','Full-time','Hybrid','$130,000–$175,000','Develop and evaluate models that support search and recommendations.',5,'data-scientist' UNION ALL
  SELECT 'Backend Engineer','Copperline Systems','Seattle, WA','Full-time','Hybrid','$105,000–$150,000','Design reliable APIs and services for a collaborative software team.',2,'backend' UNION ALL
  SELECT 'API Developer','Cedar & Finch','Remote','Full-time','Remote','$90,000–$125,000','Build integrations and maintain API services used by customer-facing applications.',6,'backend' UNION ALL
  SELECT 'Product Designer','Daybreak Studio','Remote','Full-time','Remote','$90,000–$130,000','Research user needs and design clear workflows for a digital product.',3,'uiux' UNION ALL
  SELECT 'Security Operations Analyst','Beacon Ridge Security','Washington, DC','Full-time','On-site','$85,000–$120,000','Review security alerts, investigate incidents and improve monitoring practices.',1,'cybersecurity' UNION ALL
  SELECT 'Associate Product Manager','Lattice Works','San Diego, CA','Full-time','Hybrid','$95,000–$130,000','Coordinate product discovery and delivery with design, engineering and support teams.',3,'product-manager' UNION ALL
  SELECT 'DevOps Engineer','Branchline Cloud','Remote','Full-time','Remote','$115,000–$160,000','Improve cloud deployments, infrastructure automation and service reliability.',3,'devops' UNION ALL
  SELECT 'Mobile App Developer','Pocket Garden','Remote','Full-time','Remote','$90,000–$130,000','Build and maintain mobile features for a consumer application.',2,'mobile' UNION ALL
  SELECT 'QA Automation Engineer','Acorn Quality','Remote','Full-time','Remote','$80,000–$115,000','Develop automated tests and work with engineers to prevent regressions.',3,'qa' UNION ALL
  SELECT 'Cloud Infrastructure Engineer','Atlas Cloud','Boston, MA','Full-time','Hybrid','$110,000–$155,000','Design secure cloud infrastructure and improve deployment tooling.',1,'cloud'
) x JOIN careers c ON c.slug = x.career_slug
WHERE NOT EXISTS (SELECT 1 FROM jobs j WHERE j.title = x.title AND j.company = x.company);

INSERT IGNORE INTO job_skills (job_id, skill_id)
SELECT j.id, s.id FROM jobs j JOIN skills s ON
  (j.career_id = (SELECT id FROM careers WHERE slug = 'frontend') AND s.name IN ('React','JavaScript','CSS')) OR
  (j.career_id = (SELECT id FROM careers WHERE slug = 'data-analyst') AND s.name IN ('SQL','Statistics','Tableau')) OR
  (j.career_id = (SELECT id FROM careers WHERE slug = 'data-scientist') AND s.name IN ('Python','Machine Learning','Statistics')) OR
  (j.career_id = (SELECT id FROM careers WHERE slug = 'backend') AND s.name IN ('Node.js','REST APIs','SQL')) OR
  (j.career_id = (SELECT id FROM careers WHERE slug = 'uiux') AND s.name IN ('Figma','Prototyping','User Research')) OR
  (j.career_id = (SELECT id FROM careers WHERE slug = 'cybersecurity') AND s.name IN ('Cybersecurity','Linux','Networking')) OR
  (j.career_id = (SELECT id FROM careers WHERE slug = 'devops') AND s.name IN ('Docker','AWS','Linux')) OR
  (j.career_id = (SELECT id FROM careers WHERE slug = 'mobile') AND s.name IN ('React','JavaScript','Java')) OR
  (j.career_id = (SELECT id FROM careers WHERE slug = 'qa') AND s.name IN ('Testing','JavaScript','Git')) OR
  (j.career_id = (SELECT id FROM careers WHERE slug = 'cloud') AND s.name IN ('AWS','Docker','Linux'));
