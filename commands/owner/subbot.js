const subbotManager = require("../../lib/subbotManager");

function buildHelp(prefix = ".") {
  return [
    "SUBBOT MANAGER",
    "",
    `Uso rapido:`,
    `${prefix}subbot`,
    `${prefix}subbot crear <nombre> <numero>`,
    `${prefix}subbot lista`,
    `${prefix}subbot codigo <nombre>`,
    `${prefix}subbot iniciar <nombre>`,
    `${prefix}subbot detener <nombre>`,
    `${prefix}subbot reiniciar <nombre>`,
    `${prefix}subbot numero <nombre> <nuevo_numero>`,
    `${prefix}subbot borrar <nombre>`,
  ].join("\n");
}

function formatSubbotLine(record) {
  const codeLine =
    !record.registered && record.pairingCode
      ? ` | code: ${record.pairingCode}`
      : "";

  return `• ${record.alias} | ${record.lastState} | num: ${subbotManager.maskPhone(record.phone)} | port: ${record.port}${codeLine}`;
}

async function buildSummaryText() {
  const stats = await subbotManager.getSubbotStats();
  const lines = [
    "SUBBOTS",
    "",
    `Slots: ${stats.total}/${stats.maxLinks}`,
    `Disponibles: ${stats.availableSlots}`,
    `Activos: ${stats.running}`,
    `Vinculados: ${stats.linked}`,
  ];

  if (!stats.records.length) {
    lines.push("", "No hay subbots creados todavia.");
    return lines.join("\n");
  }

  lines.push("", "Lista:");
  lines.push(...stats.records.map(formatSubbotLine));
  return lines.join("\n");
}

module.exports = {
  command: ["subbot", "subbots"],
  categoria: "owner",
  description: "Gestiona subbots y sus codigos de vinculacion",

  run: async (client, m, args) => {
    const sender = String(m.sender || "").split("@")[0];
    if (!global.owner.includes(sender)) {
      return client.reply(
        m.chat,
        "Solo el owner puede usar este comando.",
        m,
        global.channelInfo,
      );
    }

    const action = String(args[0] || "lista").trim().toLowerCase();
    const target = String(args[1] || "").trim();

    try {
      if (["help", "ayuda"].includes(action)) {
        return client.reply(m.chat, buildHelp("."), m, global.channelInfo);
      }

      if (["lista", "list", "slots", "ver", "info"].includes(action) || !action) {
        return client.reply(
          m.chat,
          await buildSummaryText(),
          m,
          global.channelInfo,
        );
      }

      if (["crear", "create", "nuevo"].includes(action)) {
        const alias = target;
        const phone = args[2];

        if (!alias || !phone) {
          return client.reply(
            m.chat,
            `Uso: .subbot crear <nombre> <numero>\nEjemplo: .subbot crear tienda1 51999999999`,
            m,
            global.channelInfo,
          );
        }

        await client.reply(
          m.chat,
          "Creando subbot y preparando pairing...",
          m,
          global.channelInfo,
        );

        const record = await subbotManager.createSubbot({
          alias,
          phone,
          ownerJid: m.sender,
        });

        const summary = await buildSummaryText();
        return client.reply(
          m.chat,
          [
            `Subbot creado: ${record.alias}`,
            `Estado: ${record.lastState}`,
            `Numero: ${subbotManager.maskPhone(record.phone)}`,
            `Puerto: ${record.port}`,
            `Codigo: ${record.pairingCode || "Aun no disponible"}`,
            "",
            summary,
          ].join("\n"),
          m,
          global.channelInfo,
        );
      }

      if (!target) {
        return client.reply(
          m.chat,
          buildHelp("."),
          m,
          global.channelInfo,
        );
      }

      if (["codigo", "code", "qr"].includes(action)) {
        const record = await subbotManager.getSubbot(target);
        if (!record) {
          return client.reply(m.chat, "Ese subbot no existe.", m, global.channelInfo);
        }

        return client.reply(
          m.chat,
          [
            `Subbot: ${record.alias}`,
            `Estado: ${record.lastState}`,
            `Vinculado: ${record.registered ? "si" : "no"}`,
            `Codigo: ${record.pairingCode || "No disponible todavia"}`,
            `Numero: ${subbotManager.maskPhone(record.phone)}`,
            `Ultimo inicio: ${subbotManager.formatTimestamp(record.lastStartAt)}`,
          ].join("\n"),
          m,
          global.channelInfo,
        );
      }

      if (["iniciar", "start", "encender"].includes(action)) {
        await client.reply(m.chat, "Iniciando subbot...", m, global.channelInfo);
        const record = await subbotManager.startSubbot(target);
        return client.reply(
          m.chat,
          [
            `Subbot iniciado: ${record.alias}`,
            `Estado: ${record.lastState}`,
            `Puerto: ${record.port}`,
            `Codigo: ${record.pairingCode || "Esperando codigo..."}`,
          ].join("\n"),
          m,
          global.channelInfo,
        );
      }

      if (["detener", "stop", "apagar"].includes(action)) {
        const record = await subbotManager.stopSubbot(target);
        return client.reply(
          m.chat,
          [
            `Subbot detenido: ${record.alias}`,
            `Estado: ${record.lastState}`,
            `Ultima parada: ${subbotManager.formatTimestamp(record.lastStopAt)}`,
          ].join("\n"),
          m,
          global.channelInfo,
        );
      }

      if (["reiniciar", "restart"].includes(action)) {
        await client.reply(m.chat, "Reiniciando subbot...", m, global.channelInfo);
        const record = await subbotManager.restartSubbot(target);
        return client.reply(
          m.chat,
          [
            `Subbot reiniciado: ${record.alias}`,
            `Estado: ${record.lastState}`,
            `Codigo: ${record.pairingCode || "Esperando codigo..."}`,
          ].join("\n"),
          m,
          global.channelInfo,
        );
      }

      if (["numero", "phone", "tel"].includes(action)) {
        const phone = args[2];
        if (!phone) {
          return client.reply(
            m.chat,
            `Uso: .subbot numero <nombre> <nuevo_numero>`,
            m,
            global.channelInfo,
          );
        }

        const record = await subbotManager.updateSubbotPhone(target, phone);
        return client.reply(
          m.chat,
          [
            `Numero actualizado para ${record.alias}`,
            `Nuevo numero: ${subbotManager.maskPhone(record.phone)}`,
          ].join("\n"),
          m,
          global.channelInfo,
        );
      }

      if (["borrar", "delete", "eliminar"].includes(action)) {
        await subbotManager.deleteSubbot(target);
        return client.reply(
          m.chat,
          `Subbot eliminado: ${target}`,
          m,
          global.channelInfo,
        );
      }

      return client.reply(m.chat, buildHelp("."), m, global.channelInfo);
    } catch (error) {
      console.error("SUBBOT ERROR:", error?.message || error);
      return client.reply(
        m.chat,
        String(error?.message || "No se pudo gestionar el subbot."),
        m,
        global.channelInfo,
      );
    }
  },
};
