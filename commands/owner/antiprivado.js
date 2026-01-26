module.exports = {
  command: ["antiprivado"],
  categoria: "owner",

  run: async (client, m, args) => {
    const senderNum = m.sender.split("@")[0];
    if (!global.owner.includes(senderNum))
      return m.reply("⛔ Solo el owner puede usar este comando");

    if (!args[0])
      return m.reply("⚙️ Uso:\n/antiprivado on\n/antiprivado off");

    if (args[0] === "on") {
      global.antiPrivado = true;
      return m.reply("✅ Anti-privado ACTIVADO");
    }

    if (args[0] === "off") {
      global.antiPrivado = false;
      return m.reply("❌ Anti-privado DESACTIVADO");
    }
  },
};
