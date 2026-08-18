// Kullanım: node scripts/export-data.mjs
// Çıktı: exports/ klasörüne 2 CSV dosyası üretir.
// .env dosyasındaki TURSO_DATABASE_URL/TURSO_AUTH_TOKEN varsa Turso'dan,
// yoksa yerel db/data.sqlite dosyasından okur.

import { createClient } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";
import "dotenv/config";

const url = process.env.TURSO_DATABASE_URL || `file:${path.join(process.cwd(), "db", "data.sqlite")}`;
const authToken = process.env.TURSO_AUTH_TOKEN;
const db = createClient({ url, authToken });

const OUT_DIR = path.join(process.cwd(), "exports");
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);

function toCSV(rows) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (val) => {
    if (val === null || val === undefined) return "";
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  }
  return lines.join("\n");
}

async function run() {
  const usersWithInterests = await db.execute(`
    SELECT
      u.id AS user_id, u.age_range, u.gender, u.education_level, u.occupation_status,
      u.country, u.city, u.settlement_type,
      pv.post_slug, pv.time_spent_seconds, pv.viewed_at
    FROM users u
    JOIN post_views pv ON pv.user_id = u.id
    WHERE u.consent_research = 1
    ORDER BY u.id
  `);
  fs.writeFileSync(path.join(OUT_DIR, "users_with_interests.csv"), toCSV(usersWithInterests.rows));

  const surveyResults = await db.execute(`
    SELECT
      u.id AS user_id, u.age_range, u.gender, u.education_level, u.occupation_status,
      u.country, u.city, u.settlement_type,
      sq.section, sq.question_text, sr.answer_text, sr.answered_at
    FROM survey_responses sr
    JOIN users u ON u.id = sr.user_id
    JOIN survey_questions sq ON sq.id = sr.question_id
    WHERE u.consent_research = 1
    ORDER BY u.id, sq.section, sq.order_index
  `);
  fs.writeFileSync(path.join(OUT_DIR, "survey_results.csv"), toCSV(surveyResults.rows));

  console.log(`✔ ${usersWithInterests.rows.length} ilgi-alanı satırı -> exports/users_with_interests.csv`);
  console.log(`✔ ${surveyResults.rows.length} anket cevabı -> exports/survey_results.csv`);
  console.log(`\nNot: Sadece consent_research = 1 olan (onay veren) kullanıcılar dahil edildi.`);
}

run().catch((e) => {
  console.error("Hata:", e);
  process.exit(1);
});
