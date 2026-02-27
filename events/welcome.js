const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "../database/welcome.json");

const getDB = () => {
  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    fs.writeFileSync(dbPath, "{}");
  }
  return JSON.parse(fs.readFileSync(dbPath, "utf-8"));
};

console.log("✅ welcome.js cargado correctamente");

module.exports = async (update, client) => {
  try {
    if (!update || !client) return;

    const { id, participants, action } = update;
    if (!id || !participants || !action) return;

    const db = getDB();
    if (!db[id]?.enabled) return;

    for (const user of participants) {
      const number = user.split("@")[0];

      /* ======================
         🟢 USUARIO ENTRA
      ====================== */
      if (action === "add" || action === "invite") {
        await client.sendMessage(id, {
          image: {
            url: "https://i.ibb.co/8nkQYcqY/file-00000000afdc720ebbb440ea6ed8b962-1.png",
          },
          caption: `
╭───〔 👋 *BIENVENIDO* 〕───╮
│
│ 🙋 Usuario: *@${number}*
│
│ 📜 *REGLAS DEL GRUPO*
│ 1️⃣ Respeto entre miembros
│ 2️⃣ Prohibido insultos u odio
│ 3️⃣ No spam ni flood
│ 4️⃣ Links solo con permiso
│ 5️⃣ Prohibido +18
│ 6️⃣ Nada de estafas
│ 7️⃣ Seguir a los admins
│ 8️⃣ No bots externos
│
│ ⚠️ Incumplir reglas
│ ⛔ Expulsión inmediata
│
╰────────────────────────╯
`,
          mentions: [user],
        });
      }

      /* ======================
         🔴 USUARIO SALE
      ====================== */
      if (action === "remove") {
        await client.sendMessage(id, {
          text: `
╭───〔 😢 *DESPEDIDA* 〕───╮
│
│ 👤 *@${number}*
│ salió del grupo
│
│ 💭 Gracias por participar
│
╰───────────────────────╯
`,
          mentions: [user],
        });
      }
    }
  } catch (e) {
    console.log("❌ Error welcome:", e?.message || e);
  }
};
