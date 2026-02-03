const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "../database/welcome.json");

const getDB = () => {
  if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, "{}");
  return JSON.parse(fs.readFileSync(dbPath));
};

console.log("✅ welcome.js cargado");

module.exports = async (client, update) => {
  try {
    console.log("📥 Evento recibido:", update);

    const { id, participants, action } = update;
    if (!id || !participants) return;

    const db = getDB();
    if (!db[id] || db[id].enabled !== true) return;

    for (const user of participants) {
      const number = user.split("@")[0];

      // 🟢 ENTRADA (add / invite)
      if (action === "add" || action === "invite") {
        await client.sendMessage(id, {
          text: `👋 *BIENVENIDO AL GRUPO*

🙋 *@${number}*

📜 *REGLAS DEL GRUPO*
1️⃣ Respeto total  
2️⃣ No insultos ni odio  
3️⃣ No spam / flood  
4️⃣ No links sin permiso  
5️⃣ No contenido +18  
6️⃣ No estafas  
7️⃣ Seguir indicaciones de admins  

⚠️ Incumplir reglas = expulsión`,
          mentions: [user],
        });
      }

      // 🔴 SALIDA
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