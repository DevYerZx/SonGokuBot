module.exports = async (client, update) => {
  try {
    const { id, participants, action } = update;

    // Solo cuando alguien entra
    if (action !== "add") return;

    for (let user of participants) {
      const number = user.split("@")[0];

      const text = `
👋 *BIENVENIDO AL GRUPO*

🙋 @${number}

📜 *REGLAS DEL GRUPO*
1️⃣ Respeto obligatorio  
2️⃣ No spam ni links  
3️⃣ No porno  
4️⃣ No insultos  
5️⃣ Sigue a los admins  

⚠️ El incumplimiento = expulsión

🔥 Disfruta el grupo 😎
`;

      await client.sendMessage(id, {
        text,
        mentions: [user]
      });
    }
  } catch (e) {
    console.log("❌ Error bienvenida:", e);
  }
};