// Kullanım: node scripts/seed-survey.mjs
// Kullanıcının belirttiği tüm sosyolojik anket sorularını survey_questions
// tablosuna yükler. .env dosyasındaki TURSO_DATABASE_URL/TURSO_AUTH_TOKEN
// varsa Turso'ya, yoksa yerel db/data.sqlite dosyasına yazar.

import { createClient } from "@libsql/client";
import path from "node:path";
import "dotenv/config";

const url = process.env.TURSO_DATABASE_URL || `file:${path.join(process.cwd(), "db", "data.sqlite")}`;
const authToken = process.env.TURSO_AUTH_TOKEN;
const db = createClient({ url, authToken });

const opt = (arr) => JSON.stringify(arr);

const questions = [
  { section: "sosyoekonomik", order_index: 1, required: 0, text: "Kendinizi ekonomik olarak nasıl tanımlarsınız?", type: "single_choice", options: ["Maddi açıdan rahat", "Orta düzeyde", "Geçinmekte zorlanıyorum", "Maddi açıdan oldukça zorlanıyorum", "Belirtmek istemiyorum"] },
  { section: "sosyoekonomik", order_index: 2, required: 0, text: "Hane geliriniz hangi aralıkta?", type: "single_choice", options: ["0–20.000 TL", "20.001–40.000 TL", "40.001–60.000 TL", "60.001–100.000 TL", "100.000 TL+", "Belirtmek istemiyorum"] },
  { section: "okuma", order_index: 1, required: 0, text: "Ne sıklıkla kitap okursunuz?", type: "single_choice", options: ["Her gün", "Haftada birkaç kez", "Haftada bir", "Ayda birkaç kez", "Nadiren"] },
  { section: "okuma", order_index: 2, required: 0, text: "Ayda yaklaşık kaç kitap okursunuz?", type: "number", options: null },
  { section: "okuma", order_index: 3, required: 0, text: "En çok hangi türleri okursunuz?", type: "multi_choice", options: ["Edebiyat", "Şiir", "Felsefe", "Sosyoloji", "Siyaset", "Feminist teori", "Ekoloji", "Tarih", "Bilimkurgu/fantastik", "Polisiye", "Grafik roman/manga", "Diğer"] },
  { section: "sinema", order_index: 1, required: 0, text: "Ne sıklıkla film izlersiniz?", type: "single_choice", options: ["Her gün", "Haftada birkaç kez", "Haftada bir", "Ayda birkaç kez", "Nadiren"] },
  { section: "sinema", order_index: 2, required: 0, text: "Daha çok hangi sinema türleriyle ilgileniyorsunuz?", type: "multi_choice", options: ["Bağımsız sinema", "Politik sinema", "Feminist sinema", "Belgesel", "Klasik sinema", "Hollywood", "Avrupa sineması", "Asya sineması", "Queer sinema", "Deneysel sinema", "Diğer"] },
  { section: "politik_tutum", order_index: 1, required: 0, text: "Toplumsal eşitsizliklerin temelinde ekonomik sistemlerin önemli bir rolü olduğunu düşünüyorum.", type: "likert", options: ["1 - Kesinlikle katılmıyorum", "2", "3", "4", "5 - Kesinlikle katılıyorum"] },
  { section: "politik_tutum", order_index: 2, required: 0, text: "Toplumsal cinsiyet eşitsizliği bireysel davranışlardan çok yapısal sorunlarla ilişkilidir.", type: "likert", options: ["1 - Kesinlikle katılmıyorum", "2", "3", "4", "5 - Kesinlikle katılıyorum"] },
  { section: "politik_tutum", order_index: 3, required: 0, text: "Ekonomik büyüme çevresel sınırlar dikkate alınarak sınırlandırılmalıdır.", type: "likert", options: ["1 - Kesinlikle katılmıyorum", "2", "3", "4", "5 - Kesinlikle katılıyorum"] },
  { section: "politik_tutum", order_index: 4, required: 0, text: "Devlet sosyal ve ekonomik eşitsizlikleri azaltmada aktif rol üstlenmelidir.", type: "likert", options: ["1 - Kesinlikle katılmıyorum", "2", "3", "4", "5 - Kesinlikle katılıyorum"] },
  { section: "politik_tutum", order_index: 5, required: 0, text: "Mevcut siyasi ve ekonomik düzenin köklü biçimde değiştirilmesi gerektiğini düşünüyorum.", type: "likert", options: ["1 - Kesinlikle katılmıyorum", "2", "3", "4", "5 - Kesinlikle katılıyorum"] },
  { section: "politik_tutum", order_index: 6, required: 0, text: "Toplumsal değişimde bireysel davranışlardan çok kolektif eylemin etkili olduğuna inanıyorum.", type: "likert", options: ["1 - Kesinlikle katılmıyorum", "2", "3", "4", "5 - Kesinlikle katılıyorum"] },
  { section: "kesif", order_index: 1, required: 0, text: "The Coven Journal'ı nasıl keşfettiniz?", type: "single_choice", options: ["Instagram", "X/Twitter", "TikTok", "Google", "Arkadaş önerisi", "Başka bir web sitesi", "Üniversite", "Etkinlik", "Diğer"] },
  { section: "kesif", order_index: 2, required: 0, text: "Coven'ı ne sıklıkla ziyaret ediyorsunuz?", type: "single_choice", options: ["Her gün", "Haftada birkaç kez", "Haftada bir", "Ayda birkaç kez", "Nadiren"] },
  { section: "kesif", order_index: 3, required: 0, text: "En çok hangi bölümleri okuyorsunuz?", type: "multi_choice", options: ["Blogs", "Lists", "Collective", "News", "Reports", "Field Notes"] },
  { section: "ilgi_alanlari", order_index: 1, required: 0, text: "Aşağıdaki alanlardan hangileriyle ilgileniyorsunuz?", type: "multi_choice", options: ["Feminizm", "Toplumsal cinsiyet", "LGBTQ+ çalışmaları", "Ekoloji", "İklim krizi", "Hayvan hakları", "Kent çalışmaları", "Göç", "Sınıf", "Emek", "Kapitalizm", "Siyaset", "Uluslararası ilişkiler", "Savaş/barış", "Kolonyalizm", "Postkolonyalizm", "Sinema", "Edebiyat", "Sanat", "Müzik", "Felsefe", "Tarih", "Teknoloji", "Dijital kültür", "İnternet kültürü", "Aktivizm", "Popüler kültür"] },
  { section: "medya", order_index: 1, required: 0, text: "Günlük ortalama internet kullanımınız ne kadar?", type: "single_choice", options: ["1 saatten az", "1-3 saat", "3-5 saat", "5-8 saat", "8 saatten fazla"] },
  { section: "medya", order_index: 2, required: 0, text: "En çok hangi platformları kullanıyorsunuz?", type: "multi_choice", options: ["Instagram", "X/Twitter", "TikTok", "YouTube", "Reddit", "Facebook", "Pinterest", "LinkedIn", "Diğer"] },
  { section: "medya", order_index: 3, required: 0, text: "Haberleri nereden takip ediyorsunuz?", type: "multi_choice", options: ["Geleneksel medya", "Bağımsız medya", "Sosyal medya", "Akademik yayınlar", "Newsletter", "Podcast", "YouTube", "Arkadaş/çevre", "Hiçbirini düzenli takip etmiyorum"] },
  { section: "medya", order_index: 4, required: 0, text: "Güvendiğiniz bilgi kaynakları nelerdir?", type: "open_text", options: null },
  { section: "beklenti", order_index: 1, required: 0, text: "Coven'da daha fazla hangi içerikleri görmek istersiniz?", type: "multi_choice", options: ["Blogs", "Lists", "Collective", "News", "Reports", "Field Notes", "Diğer"] },
  { section: "beklenti", order_index: 2, required: 0, text: "Coven sizin için ne ifade ediyor?", type: "open_text", options: null },
];

async function run() {
  // şemayı garantiye al
  const fs = await import("node:fs");
  const schema = fs.readFileSync(path.join(process.cwd(), "db", "schema.sql"), "utf-8");
  await db.executeMultiple(schema);

  let added = 0;
  for (const q of questions) {
    const existing = await db.execute({
      sql: `SELECT id FROM survey_questions WHERE question_text = ?`,
      args: [q.text],
    });
    if (existing.rows.length > 0) continue;

    await db.execute({
      sql: `INSERT INTO survey_questions (section, order_index, question_text, question_type, options_json, required)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [q.section, q.order_index, q.text, q.type, q.options ? opt(q.options) : null, q.required],
    });
    added++;
  }

  console.log(`✔ ${added} yeni soru eklendi (toplam tanımlı soru: ${questions.length}).`);
}

run().catch((e) => {
  console.error("Hata:", e);
  process.exit(1);
});
