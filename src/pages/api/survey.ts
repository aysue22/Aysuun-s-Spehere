import type { APIRoute } from "astro";
import { db, ensureSchema } from "../../lib/db";
import { getCurrentUser } from "../../lib/auth";

export const prerender = false;

export const GET: APIRoute = async () => {
  await ensureSchema();
  const result = await db.execute(
    `SELECT id, section, order_index, question_text, question_type, options_json
     FROM survey_questions WHERE active = 1 ORDER BY section, order_index`
  );
  return new Response(JSON.stringify({ questions: result.rows }), { status: 200 });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  await ensureSchema();
  const user = await getCurrentUser(cookies);
  if (!user) {
    return new Response(
      JSON.stringify({ error: "Anket cevaplamak için giriş yapmalısınız." }),
      { status: 401 }
    );
  }

  const { answers } = await request.json();
  if (!Array.isArray(answers) || answers.length === 0) {
    return new Response(JSON.stringify({ error: "Cevap listesi boş." }), {
      status: 400,
    });
  }

  for (const row of answers) {
    await db.execute({
      sql: `INSERT INTO survey_responses (user_id, question_id, answer_text) VALUES (?, ?, ?)`,
      args: [(user as any).id, row.question_id, row.answer_text],
    });
  }

  return new Response(JSON.stringify({ success: true }), { status: 201 });
};
