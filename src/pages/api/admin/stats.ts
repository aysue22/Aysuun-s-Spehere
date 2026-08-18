import type { APIRoute } from "astro";
import { db, ensureSchema } from "../../../lib/db";
import { isAdminAuthenticated } from "../../../lib/admin-auth";

export const prerender = false;

async function countBy(column: string) {
  const result = await db.execute(
    `SELECT COALESCE(${column}, 'Belirtilmemiş') AS label, COUNT(*) AS count
     FROM users WHERE consent_research = 1
     GROUP BY label ORDER BY count DESC`
  );
  return result.rows;
}

export const GET: APIRoute = async ({ cookies }) => {
  await ensureSchema();
  if (!(await isAdminAuthenticated(cookies))) {
    return new Response(JSON.stringify({ error: "Yetkisiz." }), { status: 401 });
  }

  const totalUsersResult = await db.execute(`SELECT COUNT(*) AS c FROM users`);
  const totalUsers = Number((totalUsersResult.rows[0] as any).c);

  const totalSurveyResult = await db.execute(
    `SELECT COUNT(DISTINCT user_id) AS c FROM survey_responses`
  );
  const totalSurveyResponses = Number((totalSurveyResult.rows[0] as any).c);

  const demographics = {
    age_range: await countBy("age_range"),
    gender: await countBy("gender"),
    education_level: await countBy("education_level"),
    occupation_status: await countBy("occupation_status"),
    settlement_type: await countBy("settlement_type"),
    country: await countBy("country"),
  };

  const topPostsResult = await db.execute(
    `SELECT post_slug, COUNT(*) AS views, AVG(time_spent_seconds) AS avg_seconds
     FROM post_views GROUP BY post_slug ORDER BY views DESC LIMIT 15`
  );

  const questionsResult = await db.execute(
    `SELECT id, section, question_text, question_type FROM survey_questions
     WHERE question_type IN ('single_choice','likert','multi_choice') AND active = 1
     ORDER BY section, order_index`
  );
  const questions = questionsResult.rows as any[];

  const answersResult = await db.execute(
    `SELECT question_id, answer_text FROM survey_responses`
  );
  const answerRows = answersResult.rows as any[];

  const surveyBreakdown = questions.map((q) => {
    const relevant = answerRows.filter((a) => a.question_id === q.id);
    const tally: Record<string, number> = {};

    for (const row of relevant) {
      if (q.question_type === "multi_choice") {
        try {
          const values: string[] = JSON.parse(row.answer_text as string);
          for (const v of values) tally[v] = (tally[v] || 0) + 1;
        } catch {
          // parse edilemeyen eski veri varsa atla
        }
      } else {
        const key = row.answer_text as string;
        tally[key] = (tally[key] || 0) + 1;
      }
    }

    return {
      question_id: q.id,
      section: q.section,
      question_text: q.question_text,
      question_type: q.question_type,
      tally,
      response_count: relevant.length,
    };
  });

  return new Response(
    JSON.stringify({
      totalUsers,
      totalSurveyResponses,
      demographics,
      topPosts: topPostsResult.rows,
      surveyBreakdown,
    }),
    { status: 200 }
  );
};
