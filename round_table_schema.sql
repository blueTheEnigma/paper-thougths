-- Departments
CREATE TABLE IF NOT EXISTS crew_departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,        -- 'Marketing', 'Design', etc.
    color VARCHAR(7) NOT NULL,               -- Hex color for UI badges
    icon VARCHAR(50) NOT NULL,               -- Lucide icon name
    created_at TIMESTAMP DEFAULT NOW()
);

-- Crew membership (global role and status)
CREATE TABLE IF NOT EXISTS crew_members (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(30) DEFAULT 'member',       -- 'member', 'lead', 'admin'
    is_active BOOLEAN DEFAULT TRUE,
    joined_at TIMESTAMP DEFAULT NOW()
);

-- Crew membership many-to-many relation for departments
CREATE TABLE IF NOT EXISTS crew_member_departments (
    crew_member_id INT REFERENCES crew_members(id) ON DELETE CASCADE,
    department_id INT REFERENCES crew_departments(id) ON DELETE CASCADE,
    PRIMARY KEY (crew_member_id, department_id)
);

-- Task labels (custom tags)
CREATE TABLE IF NOT EXISTS crew_labels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) DEFAULT '#6B7280',
    created_by INT REFERENCES crew_members(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tasks (Kanban cards)
CREATE TABLE IF NOT EXISTS crew_tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(30) DEFAULT 'todo',       -- 'todo', 'in_progress', 'review', 'done'
    priority VARCHAR(20) DEFAULT 'medium',   -- 'urgent', 'high', 'medium', 'low'
    department_id INT REFERENCES crew_departments(id) ON DELETE SET NULL,
    review_department_id INT REFERENCES crew_departments(id) ON DELETE SET NULL,
    created_by INT REFERENCES crew_members(id) ON DELETE SET NULL,
    due_date DATE,
    position INT DEFAULT 0,                  -- For ordering within a column
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Task assignees (many-to-many)
CREATE TABLE IF NOT EXISTS crew_task_assignees (
    task_id INT REFERENCES crew_tasks(id) ON DELETE CASCADE,
    crew_member_id INT REFERENCES crew_members(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, crew_member_id)
);

-- Task labels junction
CREATE TABLE IF NOT EXISTS crew_task_labels (
    task_id INT REFERENCES crew_tasks(id) ON DELETE CASCADE,
    label_id INT REFERENCES crew_labels(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, label_id)
);

-- Task comments
CREATE TABLE IF NOT EXISTS crew_comments (
    id SERIAL PRIMARY KEY,
    task_id INT REFERENCES crew_tasks(id) ON DELETE CASCADE,
    author_id INT REFERENCES crew_members(id) ON DELETE SET NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- File attachments
CREATE TABLE IF NOT EXISTS crew_attachments (
    id SERIAL PRIMARY KEY,
    task_id INT REFERENCES crew_tasks(id) ON DELETE CASCADE,
    uploaded_by INT REFERENCES crew_members(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INT,                           -- bytes
    mime_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Activity log (audit trail)
CREATE TABLE IF NOT EXISTS crew_activity_log (
    id SERIAL PRIMARY KEY,
    actor_id INT REFERENCES crew_members(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,             -- 'task_created', 'status_changed', 'comment_added', etc.
    entity_type VARCHAR(30) NOT NULL,        -- 'task', 'comment', 'member', etc.
    entity_id INT,
    metadata JSONB DEFAULT '{}',             -- Extra context (e.g. {"from": "todo", "to": "in_progress"})
    created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS crew_notifications (
    id SERIAL PRIMARY KEY,
    recipient_id INT REFERENCES crew_members(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,               -- 'task_assigned', 'review_requested', 'comment_added'
    title VARCHAR(255) NOT NULL,
    body TEXT,
    link VARCHAR(255),                       -- URL path to navigate to
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Seed Initial Permissions
INSERT INTO permissions (permission_key) VALUES ('crew_access') ON CONFLICT (permission_key) DO NOTHING;

-- Seed Initial Departments
INSERT INTO crew_departments (name, color, icon) VALUES
('Marketing', '#F59E0B', 'megaphone'),
('Design', '#8B5CF6', 'palette'),
('Content & Editorial', '#3B82F6', 'pen-tool'),
('Events & Community', '#10B981', 'calendar-heart'),
('Bookstore & Sales', '#EF4444', 'shopping-bag'),
('Operations', '#6B7280', 'settings')
ON CONFLICT (name) DO NOTHING;
