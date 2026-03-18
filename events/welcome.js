const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "../database/welcome.json");

function getDB() {
  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    fs.writeFileSync(dbPath, "{}");
  }
  return JSON.parse(fs.readFileSync(dbPath, "utf-8"));
}

console.log("welcome.js cargado correctamente");

module.exports = async (update, client) => {
  try {
    if (!update || !client) return;

    const { id, participants, action } = update;
    if (!id || !participants || !action) return;

    const db = getDB();
    if (!db[id]?.enabled) return;

    for (const user of participants) {
      const number = user.split("@")[0];

      if (action === "add" || action === "invite") {
        await client.sendMessage(id, {
          image: {
            url: "https://i.ibb.co/8nkQYcqY/file-00000000afdc720ebbb440ea6ed8b962-1.png",
          },
          caption:
            `BIENVENIDO GUERRERO Z\n\n` +
            `Nuevo guerrero: @${number}\n\n` +
            `Reglas del grupo:\n` +
            `1. Respeto entre miembros\n` +
            `2. Nada de spam ni flood\n` +
            `3. Links solo con permiso\n` +
            `4. Prohibido +18 y estafas\n` +
            `5. Sigue a los admins o Bills te borra del grupo\n\n` +
            `Tip DBZ: usa .menu para ver el bot y .perfil para empezar tu camino Saiyajin.`,
          mentions: [user],
        });
      }

      if (action === "remove") {
        await client.sendMessage(id, {
          text:
            `DESPEDIDA DBZ\n\n` +
            `@${number} salio del grupo.\n` +
            `Que Shenlong lo acompane en su siguiente aventura.`,
          mentions: [user],
        });
      }
    }
  } catch (error) {
    console.log("Error welcome:", error?.message || error);
  }
};
