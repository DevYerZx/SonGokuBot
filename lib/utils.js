async function resolveLidToRealJid(jid, client) {
  try {
    if (!jid) return jid;
    if (!jid.endsWith("@lid")) return jid;

    const decoded = client.decodeJid(jid);
    return decoded || jid;
  } catch {
    return jid;
  }
}

module.exports = { resolveLidToRealJid };

