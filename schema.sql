-- 1. Chapters Metadata Table
CREATE TABLE IF NOT EXISTS chapters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- Seed Initial Chapters
INSERT INTO chapters (name) VALUES 
('Zaria (ABU)'), 
('Kaduna'), 
('Abuja'), 
('Other')
ON CONFLICT (name) DO NOTHING;

-- 2. Core Users Table (Synced with Clerk and Registration ledger)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    clerk_id VARCHAR(100) UNIQUE,              -- Nullable so users can register before sign-in
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    instagram VARCHAR(100) UNIQUE,
    whatsapp VARCHAR(50),
    lk_id VARCHAR(50) UNIQUE,
    birthday DATE,
    chapter_id INT REFERENCES chapters(id) ON DELETE SET NULL,
    referred_by_id INT REFERENCES users(id) ON DELETE SET NULL, -- Track referral path
    milestone_tokens NUMERIC(5,2) DEFAULT 0.0,
    spendable_leaves INT DEFAULT 0,
    lifetime_leaves INT DEFAULT 0,
    book_vouchers_gifted INT DEFAULT 0,
    writing_streak INT DEFAULT 0,
    last_submission_date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Granular Permissions (RBAC)
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    permission_key VARCHAR(50) UNIQUE NOT NULL -- 'manage_chapter_events', 'view_sales_logs', 'moderate_submissions'
);

-- Seed Initial Permissions
INSERT INTO permissions (permission_key) VALUES 
('manage_chapter_events'), 
('view_sales_logs'), 
('moderate_submissions')
ON CONFLICT (permission_key) DO NOTHING;

-- Junction Table for User Permissions
CREATE TABLE IF NOT EXISTS user_permissions (
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    permission_id INT REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, permission_id)
);

-- 4. Weekly Writing Prompts
CREATE TABLE IF NOT EXISTS prompts (
    id SERIAL PRIMARY KEY,
    prompt_text TEXT NOT NULL,
    prompt_type VARCHAR(20) DEFAULT 'story', -- 'story', 'poem'
    active_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Seed Initial Welcome Prompts for Story and Poem
INSERT INTO prompts (prompt_text, prompt_type, active_date) VALUES 
('Write a short scene about discovering an ancient, dust-covered book in an unexpected place.', 'story', CURRENT_DATE),
('Write a poem about the quiet chaos of a rainy afternoon in a bookstore.', 'poem', CURRENT_DATE)
ON CONFLICT DO NOTHING;

-- 5. Submissions Table
CREATE TABLE IF NOT EXISTS submissions (
    id SERIAL PRIMARY KEY,
    author_id INT REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    genre VARCHAR(100) NOT NULL,
    logline TEXT NOT NULL,
    body_text TEXT NOT NULL,
    batch_status VARCHAR(30) DEFAULT 'draft', -- 'draft', 'queued', 'active_batch', 'archived'
    selection_reason_counts JSONB DEFAULT '{"title":0, "genre":0, "logline":0, "outside_comfort":0}'::jsonb,
    llm_editorial_summary JSONB DEFAULT NULL,
    has_laurel BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Peer Reviews Table
CREATE TABLE IF NOT EXISTS peer_reviews (
    id SERIAL PRIMARY KEY,
    submission_id INT REFERENCES submissions(id) ON DELETE CASCADE,
    reviewer_id INT REFERENCES users(id) ON DELETE SET NULL,
    pacing_rating VARCHAR(20) NOT NULL, -- 'rushed', 'balanced', 'dragging'
    strengths_array TEXT[] NOT NULL, -- ['voice', 'dialogue', etc]
    mirror_response TEXT NOT NULL,
    highwater_response TEXT NOT NULL,
    pivot_response TEXT NOT NULL,
    is_early_bird BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Chapter Pools for Pay It Forward Gifting
CREATE TABLE IF NOT EXISTS chapter_pools (
    id SERIAL PRIMARY KEY,
    chapter_id INT UNIQUE REFERENCES chapters(id) ON DELETE CASCADE,
    current_leaves_balance INT DEFAULT 0,
    target_leaves_limit INT DEFAULT 500
);

-- Seed Chapter Pools for seeded chapters
INSERT INTO chapter_pools (chapter_id)
SELECT id FROM chapters
ON CONFLICT (chapter_id) DO NOTHING;

-- 8. Orders Table for Bookstore Integration
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) UNIQUE NOT NULL,       -- 'ORD-123456'
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    guest_name VARCHAR(255),
    items TEXT NOT NULL,                        -- Comma-separated list of items
    subtotal NUMERIC(10,2) NOT NULL,
    discount NUMERIC(10,2) DEFAULT 0.00,
    total NUMERIC(10,2) NOT NULL,
    status VARCHAR(30) DEFAULT 'Pending',       -- 'Pending', 'Paid'
    sales_rep VARCHAR(255) DEFAULT 'System',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 9. Book of the Month Table
CREATE TABLE IF NOT EXISTS book_of_the_month (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    image_url TEXT NOT NULL,
    teaser TEXT NOT NULL,
    price VARCHAR(50) DEFAULT '0',
    purchase_link TEXT DEFAULT '/bookstore',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Seed initial Book of the Month (The Parlour Wife by Foluso Agbaje)
INSERT INTO book_of_the_month (title, author, image_url, teaser, price, purchase_link, active)
VALUES (
    'The Parlour Wife', 
    'Foluso Agbaje', 
    '/images/the_parlour_wife.png', 
    'Set against the backdrop of colonial Nigeria, ''The Parlour Wife'' is a gripping historical drama exploring duty, class, secrets, and a woman''s defiance. Foluso Agbaje weaves a rich tapestry of domestic intrigue and social upheaval with breathtaking prose.', 
    '7,500', 
    '/bookstore', 
    TRUE
) ON CONFLICT DO NOTHING;

