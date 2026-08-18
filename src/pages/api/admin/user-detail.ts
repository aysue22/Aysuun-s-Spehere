import type { APIRoute } from "astro";
import { db, ensureSchema } from "../../../lib/db";
import { isAdminAuthenticated } from "../../../lib/admin-auth";

export const prerender = false;

// Kullanıcı listesi (anonim - e-posta YOK, sadece id + demografik özet)
export const GET: APIRoute = async ({ cookies, url }) => {
  await ensureSchema();
  if (!(await isAdminAuthenticated(cookies))) {
    return new Response(JSON.stringify({ error: "Yetkisiz." }), { status: 401 });
  }

  const userId = url.searchParams.get("user_id");

  if (userId) {
    // TEK kullanıcının tam detayı
    const userResult = await db.execute({
      sql: `SELECT id, age_range, gender, education_level, occupation_status, country, city, settlement_type, created_at
            FROM users WHERE id = ?`,
      args: [userId],
    });
    const user = userResult.rows[0];
    if (!user) {
      return new Response(JSON.stringify({ error: "Kullanıcı bulunamadı." }), { status: 404 });
    }

    const viewsResult = await db.execute({
      sql: `SELECT post_slug, time_spent_seconds, viewed_at FROM post_views WHERE user_id = ? ORDER BY viewed_at DESC`,
      args: [userId],
    });

    const answersResult = await db.execute({
      sql: `SELECT sq.section, sq.question_text, sq.question_type, sr.answer_text
            FROM survey_responses sr
            JOIN survey_questions sq ON sq.id = sr.question_id
            WHERE sr.user_id = ?
            ORDER BY sq.section, sq.order_index`,
      args: [userId],
    });

    return new Response(
      JSON.stringify({
        user,
        postViews: viewsResult.rows,
        surveyAnswers: answersResult.rows,
      }),
      { status: 200 }
    );
  }

  // Genel LİSTE (özet - kaç yazı okumuş, ankete katılmış mı)
  const usersResult = await db.execute(`
    SELECT
      u.id, u.age_range, u.gender, u.occupation_status, u.created_at,
      (SELECT COUNT(*) FROM post_views pv WHERE pv.user_id = u.id) AS post_view_count,
      (SELECT COUNT(*) FROM survey_responses sr WHERE sr.user_id = u.id) AS survey_answer_count
    FROM users u
    WHERE u.consent_research = 1
    ORDER BY u.created_at DESC
  `);

  return new Response(JSON.stringify({ users: usersResult.rows }), { status: 200 });
};
