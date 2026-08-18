import type { APIRoute } from "astro";
import { getCurrentUser } from "../../lib/auth";

export const prerender = false;

// Statik sayfalarda (blog vb.) "giriş yapılmış mı" kontrolü için
// istemci tarafından çağrılır.
export const GET: APIRoute = async ({ cookies }) => {
  const user = await getCurrentUser(cookies);
  return new Response(JSON.stringify({ loggedIn: !!user }), { status: 200 });
};
