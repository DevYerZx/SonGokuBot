const baseCommand = require("./ytvideodoc");

module.exports = {
  ...baseCommand,
  command: ["ytmp4doc"],
  description: "Descarga video de YouTube y lo envia como documento",
};
