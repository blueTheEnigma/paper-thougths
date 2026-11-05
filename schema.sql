-- ==============================================================================
-- Paper Thoughts — Unified Database Architecture & Canonical Schema Specification
-- Engine: Neon Serverless PostgreSQL (London eu-west-2)
-- Audited & Aligned: Phase 4 Architectural Sync
-- ==============================================================================

-- ==============================================================================
-- 1. Chapters Metadata Table & Initial Seeds
-- ==============================================================================
CREATE TABLE IF NOT EXISTS chapters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

INSERT INTO chapters (name) VALUES 
('Zaria (ABU)'), 
('Kaduna'), 
('Abuja'), 
('Other')
ON CONFLICT (name) DO NOTHING;

-- ==============================================================================
-- 2. Core Users Table (Identity, Progression, Sabbaticals & Permissions)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    clerk_id VARCHAR(100) UNIQUE,                          -- External auth identity mapping
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    alias VARCHAR(100) UNIQUE,                             -- Public @moniker across salons and debates
    password_hash VARCHAR(255),                            -- bcrypt hash for direct credentials authentication
    avatar_url TEXT,                                       -- Profile picture / avatar asset URL
    instagram VARCHAR(100) UNIQUE,
    whatsapp VARCHAR(50),
    lk_id VARCHAR(50) UNIQUE,                              -- PT Lore Keeper ID (e.g. LK-2024-001)
    birthday DATE,
    chapter_id INT REFERENCES chapters(id) ON DELETE SET NULL,
    referred_by_id INT REFERENCES users(id) ON DELETE SET NULL,
    milestone_tokens NUMERIC(5,2) DEFAULT 0.0,
    spendable_leaves INT DEFAULT 0,
    lifetime_leaves INT DEFAULT 0,
    book_vouchers_gifted INT DEFAULT 0,
    panguin_stage INT DEFAULT 0,                           -- Evolution tier (0: Seedling ... 5: Lore Keeper)
    reader_archetype VARCHAR(100),                         -- Literary Zodiac archetype / reading persona
    writing_streak INT DEFAULT 0,
    last_submission_date DATE,
    streak_audited_week DATE,
    preferred_genres TEXT[] DEFAULT '{}',
    onboarded BOOLEAN DEFAULT FALSE,
    crossing_progress JSONB DEFAULT '{}'::jsonb,
    has_relic BOOLEAN DEFAULT FALSE,
    membership_status VARCHAR(50) DEFAULT 'active',        -- 'active', 'probation', 'sabbatical', 'evicted'
    probation_strikes_this_year INT DEFAULT 0,
    consecutive_botm_misses INT DEFAULT 0,
    silver_bullets INT DEFAULT 1,                          -- Annual BOTM review pardon tokens
    sabbatical_until DATE,
    sabbatical_type VARCHAR(50),
    sabbatical_requested_at TIMESTAMP WITH TIME ZONE,
    returner_petition TEXT,
    returner_petition_submitted_at TIMESTAMP WITH TIME ZONE,
    founding_badge VARCHAR(50),
    unsubscribed_from_reminders BOOLEAN DEFAULT FALSE,
    last_weekly_nudge_at TIMESTAMP WITH TIME ZONE,
    evicted_at TIMESTAMP WITH TIME ZONE,
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==============================================================================
-- 3. Granular RBAC Permissions & Role Bindings
-- ==============================================================================
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    permission_key VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO permissions (permission_key) VALUES 
('manage_chapter_events'), 
('view_sales_logs'), 
('moderate_submissions')
ON CONFLICT (permission_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS user_permissions (
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    permission_id INT REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, permission_id)
);

-- ==============================================================================
-- 4. Weekly Writing Prompts
-- ==============================================================================
CREATE TABLE IF NOT EXISTS prompts (
    id SERIAL PRIMARY KEY,
    prompt_text TEXT NOT NULL,
    prompt_type VARCHAR(20) DEFAULT 'story',               -- 'story', 'poem'
    active_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Initial Prompts Seed Bank
INSERT INTO prompts (prompt_text, prompt_type, active_date) VALUES 
('Write a short scene about discovering an ancient, dust-covered book in an unexpected place.', 'story', CURRENT_DATE),
('Write a poem about the quiet chaos of a rainy afternoon in a bookstore.', 'poem', CURRENT_DATE),
('A writer discovers that the character they killed off in their last chapter is now standing on their doorstep.', 'story', NULL),
('Write a scene in a train station where two strangers accidentally swap identical leather notebooks.', 'story', NULL),
('A glassblower creates a sphere that shows the last memory of whoever touches it.', 'story', NULL),
('Describe a clockmaker''s shop where one clock runs backward, and anyone near it grows younger.', 'story', NULL),
('A botanist discovers a species of flower that only blooms when secrets are spoken near it.', 'story', NULL),
('Write about a mapmaker who realizes the geographical changes they draw on paper become real.', 'story', NULL),
('An antique mirror is purchased, but the reflection shows the room as it was exactly fifty years ago.', 'story', NULL),
('A chef creates a recipe that brings back a specific lost memory to anyone who tastes it.', 'story', NULL),
('Write a poem centering on the smell of rain on dry soil (petrichor) and a forgotten promise.', 'poem', NULL),
('A poem exploring the silence that sits between two people at a coffee table.', 'poem', NULL),
('Write a poem using shadows as a metaphor for things left unsaid.', 'poem', NULL),
('A poem about the architecture of old libraries and the souls of books.', 'poem', NULL),
('Write a poem structured around the rhythm of a train track click-clacking in the night.', 'poem', NULL),
('A poem dedicated to the first winter leaf that refuses to fall from the branch.', 'poem', NULL),
('Write a poem about the quiet, slow decay of a deserted amusement park.', 'poem', NULL),
('A poem exploring the colors of a city skyline at 3:00 AM.', 'poem', NULL)
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- 5. Submissions & The Living Salon Interactions
-- ==============================================================================
CREATE TABLE IF NOT EXISTS submissions (
    id SERIAL PRIMARY KEY,
    author_id INT REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    genre VARCHAR(100) NOT NULL,
    logline TEXT NOT NULL,
    body_text TEXT NOT NULL,
    pen_name VARCHAR(255) DEFAULT NULL,
    batch_status VARCHAR(30) DEFAULT 'draft',              -- 'draft', 'queued', 'active_batch', 'archived'
    selection_reason_counts JSONB DEFAULT '{"title":0, "genre":0, "logline":0, "outside_comfort":0}'::jsonb,
    llm_editorial_summary JSONB DEFAULT NULL,
    has_laurel BOOLEAN DEFAULT FALSE,
    is_revised BOOLEAN DEFAULT FALSE,
    cycle_month VARCHAR(20),                               -- 'YYYY-MM'
    anthology_inducted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS submission_likes (
    id SERIAL PRIMARY KEY,
    submission_id INT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(submission_id, user_id)
);

CREATE TABLE IF NOT EXISTS submission_comments (
    id SERIAL PRIMARY KEY,
    submission_id INT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    pen_name VARCHAR(255),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS submission_ratings (
    id SERIAL PRIMARY KEY,
    submission_id INT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    review_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(submission_id, user_id)
);

-- ==============================================================================
-- 6. Peer Reviews & AI Synthesis Engine
-- ==============================================================================
CREATE TABLE IF NOT EXISTS peer_reviews (
    id SERIAL PRIMARY KEY,
    submission_id INT REFERENCES submissions(id) ON DELETE CASCADE,
    reviewer_id INT REFERENCES users(id) ON DELETE SET NULL,
    pacing_rating VARCHAR(20) NOT NULL,                    -- 'rushed', 'balanced', 'dragging'
    strengths_array TEXT[] NOT NULL,
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
    tip_amount INT DEFAULT 0,
    is_helpful BOOLEAN DEFAULT NULL,
    helpful_reviewed_at TIMESTAMP WITH TIME ZONE,
    helpful_auto_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

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

-- ==============================================================================
-- 7. Monthly Anthology Issues & Winning Inductions
-- ==============================================================================
CREATE TABLE IF NOT EXISTS monthly_anthology_issues (
    id SERIAL PRIMARY KEY,
    month_year VARCHAR(20) NOT NULL UNIQUE,                -- Format: 'YYYY-MM'
    display_title VARCHAR(255) NOT NULL,
    curator_foreword TEXT,
    published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS monthly_anthology_entries (
    id SERIAL PRIMARY KEY,
    issue_id INT NOT NULL REFERENCES monthly_anthology_issues(id) ON DELETE CASCADE,
    submission_id INT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    category VARCHAR(20) NOT NULL,                         -- 'story', 'poem'
    placement_rank INT NOT NULL,                           -- 1: Laurel / 1st place
    editor_citation TEXT NOT NULL,
    prize_amount INT DEFAULT 2000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 8. Monthly Leaderboard & Literary Honors
-- ==============================================================================
CREATE TABLE IF NOT EXISTS monthly_leaderboard (
    id SERIAL PRIMARY KEY,
    month_year VARCHAR(20) NOT NULL UNIQUE,                -- Format: 'YYYY-MM'
    general_bookie_user_id INT REFERENCES users(id) ON DELETE SET NULL,
    general_bookie_text TEXT,
    abuja_bookie_user_id INT REFERENCES users(id) ON DELETE SET NULL,
    abuja_bookie_text TEXT,
    review_of_the_month_user_id INT REFERENCES users(id) ON DELETE SET NULL,
    review_of_the_month_text TEXT,
    author_of_the_month_user_id INT REFERENCES users(id) ON DELETE SET NULL,
    author_of_the_month_text TEXT,
    most_improved_author_user_id INT REFERENCES users(id) ON DELETE SET NULL,
    most_improved_author_text TEXT,
    poet_of_the_month_user_id INT REFERENCES users(id) ON DELETE SET NULL,
    poet_of_the_month_text TEXT,
    most_improved_poet_user_id INT REFERENCES users(id) ON DELETE SET NULL,
    most_improved_poet_text TEXT,
    published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==============================================================================
-- 9. Chapter Pools (Pay It Forward Gifting)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS chapter_pools (
    id SERIAL PRIMARY KEY,
    chapter_id INT UNIQUE REFERENCES chapters(id) ON DELETE CASCADE,
    current_leaves_balance INT DEFAULT 0,
    target_leaves_limit INT DEFAULT 500
);

INSERT INTO chapter_pools (chapter_id)
SELECT id FROM chapters
ON CONFLICT (chapter_id) DO NOTHING;

-- ==============================================================================
-- 10. Bookstore Orders & Financial Ledger
-- ==============================================================================
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) UNIQUE NOT NULL,                  -- 'ORD-123456'
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    guest_name VARCHAR(255),
    items TEXT NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL,
    discount NUMERIC(10,2) DEFAULT 0.00,
    total NUMERIC(10,2) NOT NULL,
    status VARCHAR(30) DEFAULT 'Pending',                  -- 'Pending', 'Paid'
    sales_rep VARCHAR(255) DEFAULT 'System',
    transaction_fees NUMERIC(10,2) DEFAULT 0.00,
    vat_applied NUMERIC(10,2) DEFAULT 0.00,
    net_amount NUMERIC(10,2) DEFAULT 0.00,
    leaves_spent INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==============================================================================
-- 11. Book of the Month Suite (Curation, Voting, Reviews & Banter)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS book_of_the_month (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    image_url TEXT NOT NULL,
    teaser TEXT NOT NULL,
    price VARCHAR(50) DEFAULT '0',
    purchase_link TEXT DEFAULT '/bookstore',
    active BOOLEAN DEFAULT TRUE,
    chapter_id INT REFERENCES chapters(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO book_of_the_month (title, author, image_url, teaser, price, purchase_link, active)
VALUES (
    'Red Rising', 
    'Pierce Brown', 
    '/images/red_rising.jpg', 
    '“I would have lived in peace, but my enemies brought me war.” Darrow is a Red, a member of the lowest caste in the color-coded society of the future. Fueled by grief and a burning desire for justice, Darrow sacrifices everything to infiltrate the legendary Institute, a brutal proving ground where the dominant caste’s best and brightest vie for power.', 
    '', 
    '/bookstore', 
    TRUE
) ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS botm_cycles (
    id SERIAL PRIMARY KEY,
    month_year VARCHAR(20) UNIQUE NOT NULL,                -- Format: 'YYYY-MM'
    voting_open BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS botm_suggestions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_of_the_month_id INT NOT NULL REFERENCES book_of_the_month(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    teaser TEXT NOT NULL,
    chapter_id INT REFERENCES chapters(id) ON DELETE SET NULL,
    month_year VARCHAR(20) NOT NULL,                       -- Format: 'YYYY-MM'
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, book_of_the_month_id)
);

CREATE TABLE IF NOT EXISTS botm_votes (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    suggestion_id INT NOT NULL REFERENCES botm_suggestions(id) ON DELETE CASCADE,
    month_year VARCHAR(20) NOT NULL,                       -- Format: 'YYYY-MM'
    chapter_id INT REFERENCES chapters(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS unique_user_vote_general ON botm_votes(user_id, month_year) WHERE chapter_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_vote_chapter ON botm_votes(user_id, month_year, chapter_id) WHERE chapter_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS book_of_the_month_reviews (
    id SERIAL PRIMARY KEY,
    book_of_the_month_id INT NOT NULL REFERENCES book_of_the_month(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INT NOT NULL,
    review_text TEXT NOT NULL,
    is_finished BOOLEAN DEFAULT FALSE,
    is_bookie BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS book_of_the_month_comments (
    id SERIAL PRIMARY KEY,
    review_id INT NOT NULL REFERENCES book_of_the_month_reviews(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==============================================================================
-- 12. Book Pitches Suite (The Convince-Me Salon & Personal TBR)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS book_pitches (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_title VARCHAR(255) NOT NULL,
    book_author VARCHAR(255) NOT NULL,
    hook_line TEXT NOT NULL,
    aftertaste TEXT NOT NULL,
    killer_quote TEXT,
    cover_url TEXT,
    vibe_tags TEXT[] DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS book_pitch_pledges (
    id SERIAL PRIMARY KEY,
    pitch_id INT NOT NULL REFERENCES book_pitches(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reading_status VARCHAR(50) DEFAULT 'pledged',          -- 'pledged', 'reading', 'completed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(pitch_id, user_id)
);

CREATE TABLE IF NOT EXISTS book_pitch_notes (
    id SERIAL PRIMARY KEY,
    pitch_id INT NOT NULL REFERENCES book_pitches(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pen_name VARCHAR(255),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 13. Leaves & Economy Transactions Ledger
-- ==============================================================================
CREATE TABLE IF NOT EXISTS leaf_transactions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    amount INT NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==============================================================================
-- 14. Gatherings & Salons Suite (Townhalls, Book Banters & Physical Meets)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS gatherings (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    gathering_type VARCHAR(50) NOT NULL,                   -- 'townhall', 'book_banter', 'botm_review', 'physical'
    chapter_id INT REFERENCES chapters(id) ON DELETE SET NULL, -- NULL for global virtual
    event_date DATE NOT NULL,
    start_time TIME NOT NULL DEFAULT '20:15:00',
    meet_url TEXT,
    venue_name TEXT,
    description TEXT,
    status VARCHAR(30) DEFAULT 'published',                -- 'draft', 'published', 'live', 'concluded'
    magic_token VARCHAR(100) UNIQUE,
    gate_code VARCHAR(10),
    cover_url TEXT,
    co_hosts TEXT[],
    moderator_user_id INT REFERENCES users(id) ON DELETE SET NULL,
    moderator_name VARCHAR(255),
    moderator_avatar_url TEXT,
    moderator_lkid VARCHAR(50),
    moderator_bio TEXT,
    moderator_leaves_bounty INT DEFAULT 50,
    moderator_bounty_awarded BOOLEAN DEFAULT FALSE,
    first_herald_user_id INT REFERENCES users(id) ON DELETE SET NULL,
    first_herald_claimed_at TIMESTAMP WITH TIME ZONE,
    created_by_id INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gathering_rsvps (
    id SERIAL PRIMARY KEY,
    gathering_id INT NOT NULL REFERENCES gatherings(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    guest_name VARCHAR(255),
    guest_email VARCHAR(255),
    guest_whatsapp VARCHAR(50),
    is_first_herald BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(gathering_id, user_id)
);

CREATE TABLE IF NOT EXISTS gathering_attendances (
    id SERIAL PRIMARY KEY,
    gathering_id INT NOT NULL REFERENCES gatherings(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    lk_id VARCHAR(50),
    attendee_name VARCHAR(255),
    arrival_order INT,
    is_corona_muralis BOOLEAN DEFAULT FALSE,
    is_vanguard BOOLEAN DEFAULT FALSE,
    is_co_vanguard BOOLEAN DEFAULT FALSE,
    group_companions TEXT[],
    photo_proof_url TEXT,
    status VARCHAR(30) DEFAULT 'verified',                 -- 'verified', 'contested', 'revoked'
    leaves_awarded INT DEFAULT 0,
    checkin_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(gathering_id, user_id)
);

CREATE TABLE IF NOT EXISTS gathering_disputes (
    id SERIAL PRIMARY KEY,
    gathering_id INT NOT NULL REFERENCES gatherings(id) ON DELETE CASCADE,
    disputant_user_id INT REFERENCES users(id) ON DELETE CASCADE,
    target_attendance_id INT REFERENCES gathering_attendances(id) ON DELETE CASCADE,
    dispute_reason TEXT NOT NULL,
    counter_photo_proof TEXT,
    status VARCHAR(30) DEFAULT 'pending',                  -- 'pending', 'resolved_upheld', 'resolved_dismissed'
    adjudicated_by_id INT REFERENCES users(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 15. User Notifications & Web Push Subscriptions
-- ==============================================================================
CREATE TABLE IF NOT EXISTS user_notifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) DEFAULT 'general',
    title VARCHAR(255) NOT NULL,
    body TEXT,
    link VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_push_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 16. The Round Table — Internal Crew & Task CRM Suite
-- ==============================================================================
CREATE TABLE IF NOT EXISTS crew_departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(7) NOT NULL,
    icon VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crew_members (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(30) DEFAULT 'member',                     -- 'lead', 'member', 'admin'
    is_active BOOLEAN DEFAULT TRUE,
    joined_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crew_member_departments (
    crew_member_id INT NOT NULL REFERENCES crew_members(id) ON DELETE CASCADE,
    department_id INT NOT NULL REFERENCES crew_departments(id) ON DELETE CASCADE,
    PRIMARY KEY (crew_member_id, department_id)
);

CREATE TABLE IF NOT EXISTS crew_labels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) DEFAULT '#6B7280',
    created_by INT REFERENCES crew_members(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crew_tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(30) DEFAULT 'todo',                     -- 'todo', 'in_progress', 'review', 'done'
    priority VARCHAR(20) DEFAULT 'medium',                 -- 'low', 'medium', 'high', 'urgent'
    department_id INT REFERENCES crew_departments(id) ON DELETE SET NULL,
    review_department_id INT REFERENCES crew_departments(id) ON DELETE SET NULL,
    created_by INT REFERENCES crew_members(id) ON DELETE SET NULL,
    due_date DATE,
    position INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crew_task_assignees (
    task_id INT NOT NULL REFERENCES crew_tasks(id) ON DELETE CASCADE,
    crew_member_id INT NOT NULL REFERENCES crew_members(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, crew_member_id)
);

CREATE TABLE IF NOT EXISTS crew_task_labels (
    task_id INT NOT NULL REFERENCES crew_tasks(id) ON DELETE CASCADE,
    label_id INT NOT NULL REFERENCES crew_labels(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, label_id)
);

CREATE TABLE IF NOT EXISTS crew_comments (
    id SERIAL PRIMARY KEY,
    task_id INT REFERENCES crew_tasks(id) ON DELETE CASCADE,
    author_id INT REFERENCES crew_members(id) ON DELETE SET NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crew_attachments (
    id SERIAL PRIMARY KEY,
    task_id INT REFERENCES crew_tasks(id) ON DELETE CASCADE,
    uploaded_by INT REFERENCES crew_members(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INT,
    mime_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crew_activity_log (
    id SERIAL PRIMARY KEY,
    actor_id INT REFERENCES crew_members(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(30) NOT NULL,
    entity_id INT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crew_notifications (
    id SERIAL PRIMARY KEY,
    recipient_id INT REFERENCES crew_members(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    link VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
