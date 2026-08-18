import type { APIRoute } from "astro";
import { db, ensureSchema } from "../../lib/db";
import { getCurrentUser } from "../../lib/auth";

export const prerender = false;

// Bir sayfanın yorumlarını getir (herkese açık - okumak için giriş gerekmez)
export const GET: APIRoute = async ({ url }) => {
  await ensureSchema();
  const postSlug = url.searchParams.get("post_slug");
  if (!postSlug) {
    return new Response(JSON.stringify({ error: "post_slug zorunlu." }), { status: 400 });
  }

  const result = await db.execute({
    sql: `SELECT user_id, comment_text, created_at FROM comments WHERE post_slug = ? ORDER BY created_at ASC`,
    args: [postSlug],
  });

  return new Response(JSON.stringify({ comments: result.rows }), { status: 200 });
};

// Yeni yorum ekle (giriş yapmış olmak zorunlu)
export const POST: APIRoute = async ({ request, cookies }) => {
  await ensureSchema();
  const user = await getCurrentUser(cookies);
  if (!user) {
    return new Response(
      JSON.stringify({ error: "Yorum yapmak için giriş yapmalısınız." }),
      { status: 401 }
    );
  }

  const { post_slug, comment_text } = await request.json();
  if (!post_slug || !comment_text || !comment_text.trim()) {
    return new Response(JSON.stringify({ error: "Yorum metni boş olamaz." }), { status: 400 });
  }

  await db.execute({
    sql: `INSERT INTO comments (user_id, post_slug, comment_text) VALUES (?, ?, ?)`,
    args: [(user as any).id, post_slug, comment_text.trim()],
  });

  return new Response(JSON.stringify({ success: true }), { status: 201 });
};
