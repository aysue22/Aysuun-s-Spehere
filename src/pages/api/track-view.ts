import type { APIRoute } from "astro";
import { db, ensureSchema } from "../../lib/db";
import { getCurrentUser } from "../../lib/auth";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  await ensureSchema();
  const user = await getCurrentUser(cookies);

  if (!user) {
    return new Response(JSON.stringify({ tracked: false }), { status: 200 });
  }

  const { post_slug, time_spent_seconds } = await request.json();
  if (!post_slug) {
    return new Response(JSON.stringify({ error: "post_slug zorunlu." }), {
      status: 400,
    });
  }

  await db.execute({
    sql: `INSERT INTO post_views (user_id, post_slug, time_spent_seconds) VALUES (?, ?, ?)`,
    args: [(user as any).id, post_slug, time_spent_seconds ?? null],
  });

  return new Response(JSON.stringify({ tracked: true }), { status: 201 });
};
