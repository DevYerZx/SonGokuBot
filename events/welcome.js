const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "../database/welcome.json");

const getDB = () => {
  if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, "{}");
  return JSON.parse(fs.readFileSync(dbPath));
};

console.log("✅ welcome.js cargado");

module.exports = async (update, client) => {
  try {
    console.log("📥 Evento recibido:", update);

    const { id, participants, action } = update;
    if (!id || !participants) return;

    const db = getDB();
    if (!db[id]?.enabled) return;

    for (const user of participants) {
      const number = user.split("@")[0];

      // 🟢 ENTRA AL GRUPO
      if (action === "add" || action === "invite") {
        await client.sendMessage(id, {
          text: `👋 *BIENVENIDO AL GRUPO*

🙋 *@${number}*

📜 *REGLAS*
1️⃣ Respeto  
2️⃣ No insultos  
3️⃣ No spam  
4️⃣ No links sin permiso  
5️⃣ No +18  
6️⃣ No estafas  
7️⃣ Seguir admins  

⚠️ Incumplir = expulsión`,
          mentions: [user],
        });
      }

      // 🔴 SALE DEL GRUPO
      if (action === "remove") {
        await client.sendMessage(id, {
          text: `😢 *@${number}* salió del grupo.`,
          mentions: [user],
        });
      }
    }
  } catch (e) {
    console.log("❌ Error welcome:", e);
  }
};