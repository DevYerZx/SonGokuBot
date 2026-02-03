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

    for (let user of participants) {
      const number = user.split("@")[0];

      // 👋 ENTRA
      if (action === "add") {
        await client.sendMessage(id, {
          image: { url: "https://i.imgur.com/Qp0RZQp.jpg" },
          caption: `
👋 *BIENVENIDO AL GRUPO*

🙋 @${number}

📜 *REGLAS*
1️⃣ Respeto  
2️⃣ No spam  
3️⃣ No porno  
4️⃣ No links  
5️⃣ Sigue admins  

⚠️ Incumplir = expulsión
`,
          mentions: [user],
        });
      }

      // 👋 SALE
      if (action === "remove") {
        await client.sendMessage(id, {
          text: `
👋 *HASTA LUEGO*

😢 @${number} salió del grupo
`,
          mentions: [user],
        });
      }
    }
  } catch (e) {
    console.log("❌ Error welcome:", e);
  }
};