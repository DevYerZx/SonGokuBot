const fs = require("fs");
const chalk = require("chalk");

global.owner = ["51907376960"]; //Cambia este número por el tuyo
global.sessionName = "SonGokuBot_session";
global.version = "SonGokuBot";
global.namebot = "SonGokuBOT";
// creador base global.author = "Zam | Ai Lurus";
global.author = "DvYer | SonGokuBot";

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
