const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "../database/welcome.json");

const getDB = () => {
  if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, "{}");
  return JSON.parse(fs.readFileSync(dbPath));
};

const saveDB = (db) =>
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

module.exports = async (client, update) => {
  try {
    const { id, participants, action } = update;

    const db = getDB();
    if (!db[id]?.enabled) return;

    for (const user of participants) {
      const number = user.split("@")[0];

      // 🟢 ENTRA AL GRUPO
      if (action === "add") {
        await client.sendMessage(id, {
          image: { url: "https://i.imgur.com/Qp0RZQp.jpg" },
          caption: `
👋 *BIENVENIDO AL GRUPO*

🙋 *@${number}*

📜 *REGLAS DEL GRUPO*
1️⃣ Respeto total entre miembros  
2️⃣ Prohibido insultos, odio o acoso  
3️⃣ No spam ni flood  
4️⃣ No links sin permiso  
5️⃣ Prohibido porno o contenido +18  
6️⃣ Nada de estafas o engaños  
7️⃣ Seguir indicaciones de los admins  
8️⃣ No cambiar nombre o foto del grupo  
9️⃣ No bots externos sin autorización  

⚠️ *El incumplimiento puede causar expulsión inmediata*
`,
          mentions: [user],
        });
      }

      // 🔴 SALE DEL GRUPO
      if (action === "remove") {
        await client.sendMessage(id, {
          text: `
👋 *HASTA LUEGO*

😢 *@${number}* salió del grupo.
Gracias por haber sido parte.
`,
          mentions: [user],
        });
      }
    }
  } catch (e) {
    console.log("❌ Error welcome:", e);
  }
};