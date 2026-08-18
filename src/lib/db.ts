import { createClient } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";

// Yerelde (npm run dev): TURSO_DATABASE_URL tanımlı değilse,
// proje içindeki db/data.sqlite dosyasını kullanır (eskisi gibi çalışır).
//
// Production'da (Vercel): .env / Vercel Environment Variables içinde
// TURSO_DATABASE_URL ve TURSO_AUTH_TOKEN tanımlıysa, Turso'daki
// kalıcı veritabanına bağlanır. Vercel'in geçici (ephemeral) dosya
// sistemi sorununu bu şekilde aşıyoruz.
const url =
  import.meta.env.TURSO_DATABASE_URL ||
  `file:${path.join(process.cwd(), "db", "data.sqlite")}`;

const authToken = import.meta.env.TURSO_AUTH_TOKEN;

export const db = createClient({ url, authToken });

const SCHEMA_PATH = path.join(process.cwd(), "db", "schema.sql");
let schemaReady: Promise<void> | null = null;

// Her API çağrısının başında await ensureSchema() çağrılır.
// Şema IF NOT EXISTS ile yazıldığı için tekrar tekrar çağrılması güvenlidir,
// ve serverless'ta her "cold start"ta tablo var mı diye garanti eder.
export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const schema = fs.readFileSync(SCHEMA_PATH, "utf-8");
      await db.executeMultiple(schema);
    })();
  }
  return schemaReady;
}
