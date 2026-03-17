const express = require("express");
const { createServer } = require("http");

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000;
const packageInfo = require("../package.json");
let subbotManager = null;

try {
  subbotManager = require("./subbotManager");
} catch {}

app.disable("x-powered-by");

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "img-src 'self' https: data:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "connect-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "base-uri 'none'",
      "form-action 'none'",
    ].join("; "),
  );
  next();
});

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getStatusPayload() {
  const runtime = global.__songoku_runtime || {};
  const uptimeSeconds = Math.max(
    0,
    Math.floor((Date.now() - Number(runtime.startedAt || Date.now())) / 1000),
  );

  const payload = {
    bot_name: global.namebot || packageInfo.name,
    version: packageInfo.version,
    author: global.author || packageInfo.author,
    description: packageInfo.description,
    api_base: global.api?.baseUrl || null,
    session_dir: runtime.sessionDir || global.sessionName || "SonGokuBot_session",
    connection_state: runtime.connectionState || "starting",
    reconnect_attempts: Number(runtime.reconnectAttempts || 0),
    started_at: runtime.startedAt
      ? new Date(runtime.startedAt).toISOString()
      : new Date().toISOString(),
    uptime_seconds: uptimeSeconds,
    uptime_human: `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m ${uptimeSeconds % 60}s`,
    port: Number(PORT),
    profile: runtime.profile || "main",
    subbot_id: runtime.subbotId || null,
  };

  if (runtime.profile === "main" && subbotManager && global.db?.data?.subbots) {
    const records = Object.values(global.db.data.subbots || {}).map((record) =>
      subbotManager.getSubbotPaths(record.id),
    );
    payload.subbot_limit = Number(global.subbot?.maxLinks || 0);
    payload.subbot_total = Object.keys(global.db.data.subbots || {}).length;
    payload.subbot_slots_free = Math.max(
      0,
      payload.subbot_limit - payload.subbot_total,
    );
    payload.subbot_dirs = records.length;
  }

  return payload;
}

function renderIndexPage(status) {
  const connectionTone =
    status.connection_state === "open"
      ? "is-ok"
      : status.connection_state === "connecting"
        ? "is-warn"
        : "is-bad";

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(status.bot_name)} · Status</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
    <style>
      :root {
        --bg: #06141b;
        --panel: rgba(8, 27, 35, 0.72);
        --panel-strong: rgba(8, 27, 35, 0.88);
        --text: #f4efe7;
        --muted: #9fb1b8;
        --accent: #ff8c42;
        --accent-2: #39c5bb;
        --ok: #5ed184;
        --warn: #ffb347;
        --bad: #ff6b6b;
        --line: rgba(255,255,255,0.08);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        font-family: "Sora", sans-serif;
        color: var(--text);
        background:
          radial-gradient(circle at 15% 20%, rgba(255, 140, 66, 0.28), transparent 32%),
          radial-gradient(circle at 85% 15%, rgba(57, 197, 187, 0.26), transparent 28%),
          linear-gradient(160deg, #051018 0%, #0a1f2a 48%, #08161f 100%);
      }
      body::before {
        content: "";
        position: fixed;
        inset: 0;
        pointer-events: none;
        background-image:
          linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
        background-size: 30px 30px;
        mask-image: linear-gradient(to bottom, rgba(0,0,0,0.72), transparent);
      }
      .wrap {
        width: min(1080px, calc(100% - 32px));
        margin: 0 auto;
        padding: 28px 0 36px;
      }
      .hero {
        position: relative;
        overflow: hidden;
        background: linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02));
        border: 1px solid var(--line);
        border-radius: 28px;
        padding: 30px;
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28);
        backdrop-filter: blur(14px);
      }
      .hero::after {
        content: "";
        position: absolute;
        width: 240px;
        height: 240px;
        right: -80px;
        top: -70px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255,140,66,0.35), transparent 70%);
      }
      .kicker {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 8px 14px;
        border-radius: 999px;
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.1);
        font-size: 12px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
      h1 {
        margin: 18px 0 10px;
        font-size: clamp(2.2rem, 5vw, 4.6rem);
        line-height: 0.96;
        letter-spacing: -0.06em;
      }
      .lead {
        max-width: 720px;
        margin: 0;
        color: var(--muted);
        line-height: 1.7;
      }
      .hero-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 22px;
      }
      .pill {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 10px 14px;
        border-radius: 14px;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.08);
        font-size: 14px;
      }
      .dot {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: var(--warn);
        box-shadow: 0 0 0 6px rgba(255, 179, 71, 0.12);
      }
      .dot.is-ok { background: var(--ok); box-shadow: 0 0 0 6px rgba(94, 209, 132, 0.12); }
      .dot.is-warn { background: var(--warn); box-shadow: 0 0 0 6px rgba(255, 179, 71, 0.12); }
      .dot.is-bad { background: var(--bad); box-shadow: 0 0 0 6px rgba(255, 107, 107, 0.14); }
      .grid {
        display: grid;
        grid-template-columns: repeat(12, 1fr);
        gap: 18px;
        margin-top: 20px;
      }
      .card {
        grid-column: span 3;
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 22px;
        padding: 20px;
        backdrop-filter: blur(10px);
        box-shadow: 0 16px 36px rgba(0,0,0,0.18);
      }
      .card.wide { grid-column: span 6; }
      .card.full { grid-column: span 12; background: var(--panel-strong); }
      .label {
        display: block;
        color: var(--muted);
        font-size: 12px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        margin-bottom: 12px;
      }
      .value {
        font-size: 1.55rem;
        font-weight: 700;
        line-height: 1.2;
      }
      .muted {
        color: var(--muted);
        font-size: 14px;
        line-height: 1.6;
      }
      .mono {
        font-family: "IBM Plex Mono", monospace;
        word-break: break-word;
      }
      .actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        margin-top: 6px;
      }
      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 12px 16px;
        border-radius: 14px;
        text-decoration: none;
        color: var(--text);
        border: 1px solid rgba(255,255,255,0.1);
        background: linear-gradient(135deg, rgba(255,140,66,0.18), rgba(57,197,187,0.14));
      }
      .footer {
        margin-top: 18px;
        text-align: center;
        color: var(--muted);
        font-size: 13px;
      }
      @media (max-width: 980px) {
        .card, .card.wide { grid-column: span 6; }
      }
      @media (max-width: 680px) {
        .wrap { width: min(100%, calc(100% - 20px)); padding-top: 18px; }
        .hero { padding: 22px; border-radius: 24px; }
        .card, .card.wide, .card.full { grid-column: span 12; }
      }
    </style>
  </head>
  <body>
    <main class="wrap">
      <section class="hero">
        <div class="kicker">Bot Runtime · DVYER</div>
        <h1>${escapeHtml(status.bot_name)}</h1>
        <p class="lead">Panel rapido del bot para hosting. Conexion, uptime, puerto y ruta API en una sola vista, con una superficie mucho mas segura que la version anterior.</p>
        <div class="hero-meta">
          <div class="pill"><span class="dot ${connectionTone}"></span> ${escapeHtml(status.connection_state)}</div>
          <div class="pill mono">v${escapeHtml(status.version)}</div>
          <div class="pill mono">:${escapeHtml(status.port)}</div>
        </div>
      </section>
      <section class="grid">
        <article class="card">
          <span class="label">Uptime</span>
          <div class="value">${escapeHtml(status.uptime_human)}</div>
          <p class="muted">${escapeHtml(status.uptime_seconds)} segundos activos.</p>
        </article>
        <article class="card">
          <span class="label">Reintentos</span>
          <div class="value">${escapeHtml(status.reconnect_attempts)}</div>
          <p class="muted">Intentos acumulados de reconexion.</p>
        </article>
        <article class="card">
          <span class="label">Sesion</span>
          <div class="value mono">${escapeHtml(status.session_dir)}</div>
          <p class="muted">Carpeta usada por el auth state.</p>
        </article>
        <article class="card">
          <span class="label">Autor</span>
          <div class="value">${escapeHtml(status.author)}</div>
          <p class="muted">${escapeHtml(status.description)}</p>
        </article>
        <article class="card wide">
          <span class="label">API Base</span>
          <div class="value mono">${escapeHtml(status.api_base || "No configurada")}</div>
          <p class="muted">Descargas y servicios externos del bot.</p>
        </article>
        <article class="card wide">
          <span class="label">Iniciado</span>
          <div class="value mono">${escapeHtml(status.started_at)}</div>
          <p class="muted">Marca de tiempo absoluta para depuracion y monitoreo.</p>
        </article>
        <article class="card full">
          <span class="label">Accesos</span>
          <div class="actions">
            <a class="button" href="/api/status">Ver JSON /api/status</a>
            <a class="button" href="/health">Health check</a>
          </div>
          <p class="muted">Se eliminaron los endpoints inseguros que aceptaban mensajes arbitrarios por query string. Esta portada ahora sirve solo estado publico y lectura segura.</p>
        </article>
      </section>
      <div class="footer">SonGokuBot · Estado del servicio</div>
    </main>
  </body>
</html>`;
}

app.get("/", (req, res) => {
  res.type("html").send(renderIndexPage(getStatusPayload()));
});

app.get("/api/status", (req, res) => {
  res.json(getStatusPayload());
});

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    status: "healthy",
    service: global.namebot || packageInfo.name,
    timestamp: new Date().toISOString(),
  });
});

module.exports = { app, server, PORT, getStatusPayload };
