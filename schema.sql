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
    preferred_genres TEXT[] DEFAULT '{}',
    onboarded BOOLEAN DEFAULT FALSE,
    crossing_progress JSONB DEFAULT '{}'::jsonb,
    has_relic BOOLEAN DEFAULT FALSE,
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
    is_revised BOOLEAN DEFAULT FALSE,
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
    intent_source VARCHAR(30) CHECK (intent_source IN ('title', 'trope', 'logline')),
    pacing_score INT CHECK (pacing_score BETWEEN 1 AND 5),
    technical_score INT CHECK (technical_score BETWEEN 1 AND 5),
    mirror_text TEXT,
    highwater_text TEXT,
    pivot_text TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 10. Submission AI Reports Table (AI Synthesis caching)
CREATE TABLE IF NOT EXISTS submission_ai_reports (
    id SERIAL PRIMARY KEY,
    submission_id INT UNIQUE NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    intent_metrics JSONB NOT NULL DEFAULT '{"title_weight": 0, "trope_weight": 0, "logline_weight": 0}'::jsonb,
    structural_metrics JSONB NOT NULL DEFAULT '{"pacing": 0, "technical": 0}'::jsonb,
    synthesized_mirror TEXT NOT NULL,
    synthesized_highwater TEXT NOT NULL,
    synthesized_pivot TEXT NOT NULL,
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
    transaction_fees NUMERIC(10,2) DEFAULT 0.00,
    vat_applied NUMERIC(10,2) DEFAULT 0.00,
    net_amount NUMERIC(10,2) DEFAULT 0.00,
    leaves_spent INT DEFAULT 0,
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
    '', 
    '/bookstore', 
    TRUE
) ON CONFLICT DO NOTHING;

-- 11. Leaf Transactions Table (Ledger)
CREATE TABLE IF NOT EXISTS leaf_transactions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    amount INT NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 12. Digital Books Table
CREATE TABLE IF NOT EXISTS digital_books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) UNIQUE NOT NULL,
    author VARCHAR(255) NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    download_url TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 13. Book Vouchers Table
CREATE TABLE IF NOT EXISTS book_vouchers (
    id SERIAL PRIMARY KEY,
    voucher_code VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(30) DEFAULT 'Active', -- 'Active', 'Redeemed'
    creator_id INT REFERENCES users(id) ON DELETE SET NULL,
    redeemer_id INT REFERENCES users(id) ON DELETE SET NULL,
    chapter_pool_id INT REFERENCES chapter_pools(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    redeemed_at TIMESTAMP
);

-- Migration: Add preferred_genres column to users table if it does not exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_genres TEXT[] DEFAULT '{}';

-- Migration: Add transaction audit columns to orders table if they do not exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS transaction_fees NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS vat_applied NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS net_amount NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS leaves_spent INT DEFAULT 0;

-- 14. Book of the Month Suggestions Table
CREATE TABLE IF NOT EXISTS botm_suggestions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_of_the_month_id INT NOT NULL REFERENCES book_of_the_month(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    teaser TEXT NOT NULL,
    chapter_id INT REFERENCES chapters(id) ON DELETE SET NULL,
    month_year VARCHAR(20) NOT NULL, -- Format: 'YYYY-MM'
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, book_of_the_month_id)
);

-- 15. Book of the Month Votes Table
CREATE TABLE IF NOT EXISTS botm_votes (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    suggestion_id INT NOT NULL REFERENCES botm_suggestions(id) ON DELETE CASCADE,
    month_year VARCHAR(20) NOT NULL, -- Format: 'YYYY-MM'
    chapter_id INT REFERENCES chapters(id) ON DELETE SET NULL, -- Cache stream chapter_id for indexing/constraints
    created_at TIMESTAMP DEFAULT NOW()
);

-- Unique indexes to prevent double voting within the same stream and month
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_vote_general ON botm_votes(user_id, month_year) WHERE chapter_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_vote_chapter ON botm_votes(user_id, month_year, chapter_id) WHERE chapter_id IS NOT NULL;


-- Migration: Add panguin_stage column to users table if it does not exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS panguin_stage INT DEFAULT 0;

-- Migration: Add streak_audited_week column to users table if it does not exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_audited_week DATE;

-- Migration: Create botm_cycles config table if it does not exist
CREATE TABLE IF NOT EXISTS botm_cycles (
    id SERIAL PRIMARY KEY,
    month_year VARCHAR(20) UNIQUE NOT NULL,
    voting_open BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Migration: Add poetry award columns to monthly_leaderboard table if they do not exist
ALTER TABLE monthly_leaderboard ADD COLUMN IF NOT EXISTS poet_of_the_month_user_id INT REFERENCES users(id);
ALTER TABLE monthly_leaderboard ADD COLUMN IF NOT EXISTS poet_of_the_month_text TEXT;
ALTER TABLE monthly_leaderboard ADD COLUMN IF NOT EXISTS most_improved_poet_user_id INT REFERENCES users(id);
ALTER TABLE monthly_leaderboard ADD COLUMN IF NOT EXISTS most_improved_poet_text TEXT;

-- Migration: Seed 8 weeks of story prompts in the bank
INSERT INTO prompts (prompt_text, prompt_type, active_date) VALUES 
('A writer discovers that the character they killed off in their last chapter is now standing on their doorstep.', 'story', NULL),
('Write a scene in a train station where two strangers accidentally swap identical leather notebooks.', 'story', NULL),
('A glassblower creates a sphere that shows the last memory of whoever touches it.', 'story', NULL),
('Describe a clockmaker''s shop where one clock runs backward, and anyone near it grows younger.', 'story', NULL),
('A botanist discovers a species of flower that only blooms when secrets are spoken near it.', 'story', NULL),
('Write about a mapmaker who realizes the geographical changes they draw on paper become real.', 'story', NULL),
('An antique mirror is purchased, but the reflection shows the room as it was exactly fifty years ago.', 'story', NULL),
('A chef creates a recipe that brings back a specific lost memory to anyone who tastes it.', 'story', NULL)
ON CONFLICT DO NOTHING;

-- Migration: Seed 8 weeks of poetry prompts in the bank
INSERT INTO prompts (prompt_text, prompt_type, active_date) VALUES 
('Write a poem centering on the smell of rain on dry soil (petrichor) and a forgotten promise.', 'poem', NULL),
('A poem exploring the silence that sits between two people at a coffee table.', 'poem', NULL),
('Write a poem using shadows as a metaphor for things left unsaid.', 'poem', NULL),
('A poem about the architecture of old libraries and the souls of books.', 'poem', NULL),
('Write a poem structured around the rhythm of a train track click-clacking in the night.', 'poem', NULL),
('A poem dedicated to the first winter leaf that refuses to fall from the branch.', 'poem', NULL),
('Write a poem about the quiet, slow decay of a deserted amusement park.', 'poem', NULL),
('A poem exploring the colors of a city skyline at 3:00 AM.', 'poem', NULL)
ON CONFLICT DO NOTHING;


