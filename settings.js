const fs = require("fs");
const chalk = require("chalk");

global.owner = ["51907376960"]; // Cambia este número por el tuyo
global.sessionName = "SonGokuBot_session";
global.version = "SonGokuBot";
global.namebot = "SonGokuBOT";
// creador base global.author = "Zam | Ai Lurus";
global.author = "DvYer | SonGokuBot";

// 📩 Mensajes personalizados
global.mess = {
  admin: "→ Esta función está reservada para los administradores del grupo",
  botAdmin: "→ Para ejecutar esta función debo ser administrador",
  owner: "→ Solo mi creador puede usar este comando",
  group: "→ Esta función solo funciona en grupos",
  private: "→ Esta función solo funciona en mensajes privados",
  wait: "→ Espera un momento...",
};

// 🖼️ Imagen del bot
global.thumbnailUrl = "https://i.ibb.co/JR8Qz9j6/20251204-0617-Retrato-Misterioso-Mejorado-remix-01kbmh4newf9k8r1r0bafmxr46.png"; // Cambia esta imagen

// 📢 Canal principal del bot
global.my = {
  ch: "120363401477412280@newsletter", // Cambia este id por el de tu canal
};

// 📢 Configuración de channelInfo para mensajes reenviados desde canal
global.channelInfo = {
  contextInfo: {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: "120363207586611704@newsletter", // ID de tu canal
      newsletterName: "SonGokuBot DvYer",
      serverMessageId: -1,
    },
  },
};

// 🔄 Hot reload del archivo
let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.yellowBright(`Actualización '${__filename}'`));
  delete require.cache[file];
  require(file);
});
