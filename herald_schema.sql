-- ==============================================================================
-- Paper Thoughts — The Herald WhatsApp Dispatches & Idempotency Ledger
-- Engine: Neon Serverless PostgreSQL
-- ==============================================================================

CREATE TABLE IF NOT EXISTS herald_dispatches (
    id SERIAL PRIMARY KEY,
    idempotency_key VARCHAR(150) UNIQUE NOT NULL,
    channel_type VARCHAR(30) NOT NULL,            -- 'public_group', 'admin_dm'
    recipient VARCHAR(100) NOT NULL,               -- Group JID or Admin E.164 phone
    ritual_type VARCHAR(50) NOT NULL,              -- 'birthday_toast', 'submission_spotlight', etc.
    sent_successfully BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_herald_idempotency 
ON herald_dispatches (idempotency_key);

CREATE INDEX IF NOT EXISTS idx_herald_created_at
ON herald_dispatches (created_at DESC);

-- ==============================================================================
-- Paper Thoughts — The Herald Newcomers & Introductions Ledger
-- ==============================================================================

CREATE TABLE IF NOT EXISTS herald_newcomers (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(50) UNIQUE NOT NULL,
    welcome_sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    introduced_at TIMESTAMP WITH TIME ZONE,
    intro_message_id VARCHAR(100),
    push_name VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_herald_newcomers_phone 
ON herald_newcomers (phone);

CREATE INDEX IF NOT EXISTS idx_herald_newcomers_introduced 
ON herald_newcomers (introduced_at);


