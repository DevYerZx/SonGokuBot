const cooldowns = new Map()

module.exports = function cooldown(userId, time = 15000) {
  const now = Date.now()

  if (cooldowns.has(userId)) {
    const expire = cooldowns.get(userId)
    if (expire > now) {
      return Math.ceil((expire - now) / 1000)
    }
  }

  cooldowns.set(userId, now + time)
  return 0
}
