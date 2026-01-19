const fs = require("fs");
const chalk = require("chalk");

global.owner = ["5213332329453"]; //Cambia este número por el tuyo
global.sessionName = "lurus_session";
global.version = "v1.0.0 | Mini";
global.namebot = "Ai Lurus - Mini";
global.author = "Zam | Ai Lurus";

//Modifica los mensajes a tu preferencia
global.mess = {
  admin: "→ Esta función está reservada para los administradores del grupo",
  botAdmin: "→ Para ejecutar esta función debo ser administrador",
  owner: "→ Solo mi creador puede usar este comando",
  group: "→ Esta función solo funciona en grupos",
  private: "→ Esta función solo funciona en mensajes privados",
  wait: "→ Espera un momento...",
};

global.thumbnailUrl = "https://i.ibb.co/P0VXh06/5faea421e58b.jpg"; //Cambia esta imagen

global.my = {
  ch: "120363401477412280@newsletter", //Cambia este id por el de tu canal
};

let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.yellowBright(`Actualización '${__filename}'`));
  delete require.cache[file];
  require(file);
});
