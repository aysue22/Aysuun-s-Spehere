-- ============================================
-- KULLANICILAR
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,

  -- Temel demografik veriler (kayıt formunda toplanır)
  age_range TEXT,           -- '18 altı' | '18-20' | '21-24' | '25-29' | '30-39' | '40-49' | '50+'
  gender TEXT,              -- 'kadın' | 'erkek' | 'non-binary' | 'diğer' | 'belirtmek istemiyorum'
  education_level TEXT,     -- 'lise' | 'üniversite öğrencisi' | 'lisans mezunu' | 'yüksek lisans' | 'doktora' | 'diğer'
  occupation_status TEXT,   -- 'öğrenci' | 'tam zamanlı çalışan' | 'yarı zamanlı çalışan' | 'iş arıyor' | 'serbest çalışan' | 'akademisyen/araştırmacı' | 'diğer'
  country TEXT,
  city TEXT,
  settlement_type TEXT,     -- 'büyükşehir' | 'şehir' | 'ilçe' | 'kasaba' | 'köy/kırsal'

  -- Rıza / KVKK
  consent_research INTEGER DEFAULT 0,   -- verilerinin araştırmada kullanılmasına onay
  consent_given_at TEXT,

  created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- BLOG YAZILARI (siteninkiyle senkron tutulabilir,
-- ya da sadece slug/id referansı olarak kullanılabilir)
-- ============================================
CREATE TABLE IF NOT EXISTS blog_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT,             -- konu/kategori: "teknoloji", "siyaset", "sanat" vb.
  created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- İLGİ ALANI TAKİBİ: kim hangi yazıyla ilgilendi
-- ============================================
CREATE TABLE IF NOT EXISTS post_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  post_slug TEXT NOT NULL,
  viewed_at TEXT DEFAULT (datetime('now')),
  time_spent_seconds INTEGER,   -- opsiyonel: sayfada geçirilen süre

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- ANKET SORULARI
-- ============================================
CREATE TABLE IF NOT EXISTS survey_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section TEXT NOT NULL,        -- 'sosyoekonomik' | 'okuma' | 'sinema' | 'politik_tutum' |
                                 -- 'kesif' | 'ilgi_alanlari' | 'medya' | 'beklenti'
  order_index INTEGER DEFAULT 0,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL,  -- 'single_choice' | 'multi_choice' | 'likert' | 'open_text' | 'number'
  options_json TEXT,            -- seçenekli sorular için JSON dizi: '["Evet","Hayır"]'
  required INTEGER DEFAULT 0,   -- 0: opsiyonel (çoğu sosyoekonomik soru böyle olmalı)
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- ANKET CEVAPLARI
-- ============================================
CREATE TABLE IF NOT EXISTS survey_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  question_id INTEGER NOT NULL,
  answer_text TEXT NOT NULL,
  answered_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES survey_questions(id) ON DELETE CASCADE
);

-- ============================================
-- SESSION (basit cookie tabanlı oturum yönetimi)
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,          -- rastgele token
  user_id INTEGER NOT NULL,
  expires_at TEXT NOT NULL,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_post_views_user ON post_views(user_id);
CREATE INDEX IF NOT EXISTS idx_post_views_slug ON post_views(post_slug);
CREATE INDEX IF NOT EXISTS idx_survey_user ON survey_responses(user_id);

-- ============================================
-- YORUMLAR (blog/news/collective/lists altında)
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  post_slug TEXT NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comments_slug ON comments(post_slug);

-- ============================================
-- ADMIN OTURUMU (dashboard erişimi için, server-side)
-- ============================================
CREATE TABLE IF NOT EXISTS admin_sessions (
  id TEXT PRIMARY KEY,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- COLLECTIVE GÖNDERİLERİ (kullanıcı yazıları - moderasyonlu)
-- ============================================
CREATE TABLE IF NOT EXISTS collective_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  project_name TEXT NOT NULL,
  slug TEXT NOT NULL,
  tag TEXT,
  short_desc TEXT,
  link TEXT,
  content TEXT,
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'approved' | 'rejected'
  submitted_at TEXT DEFAULT (datetime('now')),
  reviewed_at TEXT,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
