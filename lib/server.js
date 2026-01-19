const express = require("express");
const { createServer } = require("http");

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000;
const packageInfo = require("../package.json");

app.all("/", (req, res) => {
  if (process.send) {
    process.send("uptime");
    process.once("message", (uptime) => {
      res.json({
        bot_name: packageInfo.name,
        version: packageInfo.version,
        author: packageInfo.author,
        description: packageInfo.description,
        uptime: `${Math.floor(uptime)} seconds`,
      });
    });
  } else res.json({ error: "Proceso no ejecutándose con IPC" });
});

app.all("/process", (req, res) => {
  const { send } = req.query;
  if (!send)
    return res.status(400).json({ error: "Consulta de envío faltante" });
  if (process.send) {
    process.send(send);
    res.json({ status: "Send", data: send });
  } else res.json({ error: "Process not running with IPC" });
});

app.all("/chat", (req, res) => {
  const { message, to } = req.query;
  if (!message || !to)
    return res.status(400).json({ error: "Mensaje faltante o para consultar" });
  res.json({ status: 200, mess: "no arranca" });
});

module.exports = { app, server, PORT };
