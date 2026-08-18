// Kullanım: node scripts/hash-admin-password.mjs "yeni-sifreniz"
// Çıktıyı kopyalayıp .env dosyanıza şu satır olarak ekleyin:
//   ADMIN_PASSWORD_HASH=<çıktı>
//
// Bu sayede şifre kodun HİÇBİR yerinde düz metin olarak durmaz.

import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password) {
  console.error('Kullanım: node scripts/hash-admin-password.mjs "sifreniz"');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);
console.log("\nBu satırı .env dosyanıza ekleyin:\n");
console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
