const TRAIN_COOLDOWN_MS = 10 * 60 * 1000;
const DRAGON_BALL_COOLDOWN_MS = 20 * 60 * 1000;
const FUSION_COOLDOWN_MS = 60 * 60 * 1000;
const FUSION_DURATION_MS = 30 * 60 * 1000;
const SHENLONG_COOLDOWN_MS = 6 * 60 * 60 * 1000;
const MISSION_DURATION_MS = 24 * 60 * 60 * 1000;
const TRIVIA_DURATION_MS = 4 * 60 * 1000;
const TOURNAMENT_DURATION_MS = 15 * 60 * 1000;

const DRAGON_BALLS = [1, 2, 3, 4, 5, 6, 7];

const RACES = {
  saiyajin: {
    key: "saiyajin",
    name: "Saiyajin",
    powerMultiplier: 1.15,
    kiMultiplier: 1.1,
    healthMultiplier: 1,
    description: "Crece rapido y aprovecha mejor las transformaciones.",
  },
  namekiano: {
    key: "namekiano",
    name: "Namekiano",
    powerMultiplier: 1,
    kiMultiplier: 1.05,
    healthMultiplier: 1.2,
    description: "Mas resistencia y mejor recuperacion en peleas largas.",
  },
  androide: {
    key: "androide",
    name: "Androide",
    powerMultiplier: 1.08,
    kiMultiplier: 1.25,
    healthMultiplier: 1,
    description: "Ki estable y golpes constantes sin tanto desgaste.",
  },
  dios: {
    key: "dios",
    name: "Dios de la Destruccion",
    powerMultiplier: 1.22,
    kiMultiplier: 1.15,
    healthMultiplier: 0.95,
    description: "Poder altisimo, pero exige subir mucho de nivel.",
  },
  angel: {
    key: "angel",
    name: "Angel",
    powerMultiplier: 1.18,
    kiMultiplier: 1.3,
    healthMultiplier: 1.05,
    description: "Gran control del ki y bonus natural al Ultra Instinto.",
  },
  humano: {
    key: "humano",
    name: "Humano",
    powerMultiplier: 0.97,
    kiMultiplier: 1,
    healthMultiplier: 1.08,
    description: "Balanceado y con mejor economia en recompensas.",
  },
};

const TRANSFORMATIONS = [
  { key: "base", name: "Base", level: 1, multiplier: 1, races: null },
  { key: "kaioken", name: "Kaioken", level: 6, multiplier: 1.25, races: ["humano", "saiyajin", "namekiano"] },
  { key: "ssj", name: "Super Saiyajin", level: 10, multiplier: 1.5, races: ["saiyajin"] },
  { key: "ssj2", name: "Super Saiyajin 2", level: 18, multiplier: 1.8, races: ["saiyajin"] },
  { key: "ssj3", name: "Super Saiyajin 3", level: 26, multiplier: 2.15, races: ["saiyajin"] },
  { key: "god", name: "Super Saiyajin God", level: 34, multiplier: 2.55, races: ["saiyajin", "dios"] },
  { key: "blue", name: "Super Saiyajin Blue", level: 42, multiplier: 3.05, races: ["saiyajin", "dios"] },
  { key: "beast", name: "Modo Beast", level: 44, multiplier: 3.2, races: ["humano", "namekiano"] },
  { key: "ultra", name: "Ultra Instinto", level: 52, multiplier: 3.9, races: ["saiyajin", "angel", "dios"] },
];

const SHOP_ITEMS = {
  senzu: { key: "senzu", name: "Semilla del Ermitao", price: 250, description: "Recupera salud y ki con .curar." },
  radar: { key: "radar", name: "Radar del Dragon", price: 450, description: "Aumenta la probabilidad de encontrar una esfera." },
  armor: { key: "armor", name: "Armadura Saiyajin", price: 700, description: "Mejora tu rendimiento en batallas PvP." },
  capsule: { key: "capsule", name: "Capsula Corp", price: 520, description: "Entrega zeni extra al entrenar." },
};

const BOSSES = [
  { name: "Freezer", hp: 12000, reward: 950, power: 1800 },
  { name: "Cell Perfecto", hp: 15000, reward: 1200, power: 2200 },
  { name: "Majin Buu", hp: 16500, reward: 1300, power: 2400 },
  { name: "Broly", hp: 18500, reward: 1500, power: 2700 },
  { name: "Jiren", hp: 22000, reward: 1900, power: 3200 },
];

const SHENLONG_WISHES = {
  zeni: { key: "zeni", label: "Zeni", description: "Entrega una fortuna para tu inventario." },
  poder: { key: "poder", label: "Poder", description: "Sube mucho tu poder base." },
  semillas: { key: "semillas", label: "Semillas", description: "Entrega semillas del ermitao y radares." },
  nivel: { key: "nivel", label: "Nivel", description: "Aumenta experiencia y zeni." },
};

const QUOTES = [
  "Yo no soy un heroe de justicia, pero siempre protegere a mis amigos.",
  "El poder viene de superar tus limites.",
  "Aunque caiga, siempre puedo levantarme mas fuerte.",
  "No importa lo dificil, un Saiyajin nunca deja de pelear.",
  "Si cuidas a tu gente, ya eres un guerrero Z.",
  "Cada combate es una oportunidad para crecer.",
];

const ATTACKS = {
  kamehameha: "lanza un Kamehameha azul que hace temblar el chat.",
  genkidama: "empieza a reunir energia de todos para una Genkidama enorme.",
  masenko: "dispara un Masenko directo al rival.",
  finalflash: "carga un Final Flash con una luz brutal.",
  hakai: "invoca un aura Hakai que borra todo a su paso.",
  kikouho: "suelta un Kikouho con todo su ki.",
};

const GUESS_ITEMS = [
  { prompt: "Adivina el personaje: hijo de Goku, desbloqueo una forma Beast.", answer: "gohan", aliases: ["son gohan", "gohan beast"] },
  { prompt: "Adivina el personaje: principe saiyajin, orgulloso y rival eterno de Goku.", answer: "vegeta", aliases: ["principe vegeta"] },
  { prompt: "Adivina el personaje: emperador del mal que destruyo el planeta Vegeta.", answer: "freezer", aliases: ["frieza"] },
  { prompt: "Adivina el personaje: angel de Bills y maestro del Ultra Instinto.", answer: "whis", aliases: [] },
  { prompt: "Adivina el personaje: guerrero fusionado entre Goku y Vegeta mediante danza.", answer: "gogeta", aliases: [] },
  { prompt: "Adivina el personaje: namekiano sabio que fue maestro de Gohan.", answer: "piccolo", aliases: ["picoro"] },
];

const TRIVIA_ITEMS = [
  { question: "Quien fue el primer gran maestro de Goku?", options: ["Bills", "Roshi", "Whis", "Kaio"], answerIndex: 1 },
  { question: "Que fusion usa los Potara?", options: ["Gogeta", "Gotenks", "Vegito", "Kefla"], answerIndex: 2 },
  { question: "Como se llama el torneo contra los universos con Zeno?", options: ["Torneo del Poder", "Cell Games", "Budokai", "Torneo de Kaio"], answerIndex: 0 },
  { question: "Que objeto sirve para invocar a Shenlong?", options: ["Semillas", "Potaras", "Esferas del Dragon", "Capsulas"], answerIndex: 2 },
  { question: "Quien enseño la tecnica de la fusion a Goten y Trunks?", options: ["Piccolo", "Goku", "Vegeta", "Kaioshin"], answerIndex: 1 },
  { question: "Que transformacion domina mejor Goku al final de Dragon Ball Super?", options: ["Ozaru", "Super Saiyajin 4", "Ultra Instinto", "Kaioken x2"], answerIndex: 2 },
  { question: "Quien es el Dios de la Destruccion del Universo 7?", options: ["Whis", "Bills", "Jiren", "Champa"], answerIndex: 1 },
];

const MISSIONS = [
  { code: "train", title: "Entrena 3 veces hoy", target: 3, reward: { zeni: 450, exp: 180, power: 120 } },
  { code: "battle", title: "Gana 1 combate PvP", target: 1, reward: { zeni: 550, exp: 220, power: 140 } },
  { code: "dragonball", title: "Encuentra 1 esfera del dragon", target: 1, reward: { zeni: 500, exp: 180, power: 110 } },
  { code: "boss", title: "Golpea al boss 3 veces", target: 3, reward: { zeni: 650, exp: 260, power: 160 } },
  { code: "trivia", title: "Responde 1 trivia DBZ", target: 1, reward: { zeni: 400, exp: 170, power: 90 } },
];

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function uniqueSortedNumbers(values) {
  return Array.from(new Set(values.map((value) => Number(value)).filter(Boolean))).sort((left, right) => left - right);
}

function ensureDbzRoot() {
  if (!global.db?.data) {
    throw new Error("La base de datos aun no esta cargada.");
  }
}

function baseUserState(name = "Guerrero") {
  return {
    name: String(name || "Guerrero").trim() || "Guerrero",
    character: null,
    race: null,
    level: 1,
    exp: 0,
    power: 900,
    ki: 100,
    health: 100,
    transformation: "Base",
    zeni: 500,
    dragonBalls: [],
    inventory: { senzu: 1, radar: 0, armor: 0, capsule: 0 },
    stats: { wins: 0, losses: 0, trainings: 0, missionsDone: 0, bossDamage: 0, dragonBallsFound: 0, triviaCorrect: 0, wishes: 0 },
    cooldowns: { train: 0, dragonBall: 0, fusion: 0 },
    mission: null,
    fusion: null,
    lastWishAt: 0,
  };
}

function baseChatState() {
  return { boss: null, trivia: null, tournament: null };
}

function ensureInventory(inventory) {
  return Object.assign({ senzu: 0, radar: 0, armor: 0, capsule: 0 }, inventory || {});
}

function ensureStats(stats) {
  return Object.assign({ wins: 0, losses: 0, trainings: 0, missionsDone: 0, bossDamage: 0, dragonBallsFound: 0, triviaCorrect: 0, wishes: 0 }, stats || {});
}

function ensureCooldowns(cooldowns) {
  return Object.assign({ train: 0, dragonBall: 0, fusion: 0 }, cooldowns || {});
}

function ensureMission(mission) {
  if (!mission || typeof mission !== "object") return null;
  return {
    code: String(mission.code || "").trim() || "train",
    title: String(mission.title || "Mision").trim() || "Mision",
    target: Number(mission.target || 1) || 1,
    progress: Number(mission.progress || 0) || 0,
    reward: Object.assign({ zeni: 0, exp: 0, power: 0 }, mission.reward || {}),
    assignedAt: Number(mission.assignedAt || Date.now()),
    expiresAt: Number(mission.expiresAt || Date.now() + MISSION_DURATION_MS),
    completed: Boolean(mission.completed),
    claimed: Boolean(mission.claimed),
  };
}

function ensureCharacter(character) {
  if (!character || typeof character !== "object") return null;
  const id = Number(character.id || 0) || 0;
  const name = String(character.name || "").trim();
  const image = String(character.image || "").trim();

  if (!id || !name || !image) {
    return null;
  }

  return {
    id,
    name,
    image,
    race: String(character.race || "").trim() || "Desconocida",
    affiliation: String(character.affiliation || "").trim() || "Desconocida",
    locked: character.locked !== false,
    selectedAt: Number(character.selectedAt || Date.now()),
  };
}

function normalizeUserState(state, name) {
  const base = Object.assign(baseUserState(name), state || {});
  base.name = String(base.name || name || "Guerrero").trim() || "Guerrero";
  base.character = ensureCharacter(base.character);
  base.inventory = ensureInventory(base.inventory);
  base.stats = ensureStats(base.stats);
  base.cooldowns = ensureCooldowns(base.cooldowns);
  base.dragonBalls = uniqueSortedNumbers(base.dragonBalls || []);
  base.transformation = String(base.transformation || "Base").trim() || "Base";
  base.mission = ensureMission(base.mission);
  return base;
}

function normalizeChatState(state) {
  return Object.assign(baseChatState(), state || {});
}

function ensureUserData(jid, pushName = "Guerrero") {
  ensureDbzRoot();
  if (!global.db.data.users[jid] || typeof global.db.data.users[jid] !== "object") {
    global.db.data.users[jid] = {};
  }
  if (!global.db.data.users[jid].dbz || typeof global.db.data.users[jid].dbz !== "object") {
    global.db.data.users[jid].dbz = baseUserState(pushName);
  }
  global.db.data.users[jid].dbz = normalizeUserState(global.db.data.users[jid].dbz, pushName);
  return global.db.data.users[jid].dbz;
}

function ensureChatData(chatId) {
  ensureDbzRoot();
  if (!global.db.data.chats[chatId] || typeof global.db.data.chats[chatId] !== "object") {
    global.db.data.chats[chatId] = {};
  }
  if (!global.db.data.chats[chatId].dbz || typeof global.db.data.chats[chatId].dbz !== "object") {
    global.db.data.chats[chatId].dbz = baseChatState();
  }
  global.db.data.chats[chatId].dbz = normalizeChatState(global.db.data.chats[chatId].dbz);
  return global.db.data.chats[chatId].dbz;
}

function getRaceData(user) {
  return user.race && RACES[user.race] ? RACES[user.race] : RACES.humano;
}

function getMaxKi(user) {
  return Math.floor((100 + user.level * 18) * getRaceData(user).kiMultiplier);
}

function getMaxHealth(user) {
  return Math.floor((100 + user.level * 12) * getRaceData(user).healthMultiplier);
}

function syncVitals(user) {
  const maxKi = getMaxKi(user);
  const maxHealth = getMaxHealth(user);
  user.ki = Math.max(0, Math.min(Number(user.ki || 0), maxKi));
  user.health = Math.max(1, Math.min(Number(user.health || 0), maxHealth));
  return { maxKi, maxHealth };
}

function cleanupFusion(user) {
  if (!user.fusion || typeof user.fusion !== "object") return;
  if (Number(user.fusion.expiresAt || 0) <= Date.now()) {
    user.fusion = null;
  }
}

function getTransformationOptions(user) {
  return TRANSFORMATIONS.filter((item) => {
    if (item.level > user.level) return false;
    if (!item.races) return true;
    return item.races.includes(user.race || "humano");
  });
}

function getTransformationData(user) {
  const available = getTransformationOptions(user);
  return available.find((item) => item.name.toLowerCase() === String(user.transformation || "Base").toLowerCase()) || available[0];
}

function getFusionBoost(user) {
  cleanupFusion(user);
  return user.fusion ? Number(user.fusion.multiplier || 1) : 1;
}

function getArmorBonus(user) {
  return Math.min(Number(user.inventory?.armor || 0), 5) * 0.04 + 1;
}

function getEffectivePower(user) {
  return Math.floor(Number(user.power || 0) * getRaceData(user).powerMultiplier * getTransformationData(user).multiplier * getFusionBoost(user) * getArmorBonus(user));
}

function getRequiredExp(level) {
  return 180 + (Math.max(1, Number(level || 1)) - 1) * 90;
}

function getProfileSummary(user) {
  cleanupFusion(user);
  const vitals = syncVitals(user);
  return {
    name: user.name,
    character: ensureCharacter(user.character),
    race: getRaceData(user).name,
    level: user.level,
    exp: user.exp,
    maxExp: getRequiredExp(user.level),
    power: user.power,
    effectivePower: getEffectivePower(user),
    ki: user.ki,
    maxKi: vitals.maxKi,
    health: user.health,
    maxHealth: vitals.maxHealth,
    transformation: getTransformationData(user).name,
    zeni: user.zeni,
    dragonBalls: uniqueSortedNumbers(user.dragonBalls),
    fusion: user.fusion,
    inventory: ensureInventory(user.inventory),
    stats: ensureStats(user.stats),
  };
}

function lockProfileCharacter(user, character) {
  const current = ensureCharacter(user.character);
  if (current?.locked) {
    throw new Error(`Ya elegiste a ${current.name} como tu personaje fijo.`);
  }

  const selected = ensureCharacter({
    id: character?.id,
    name: character?.name,
    image: character?.image,
    race: character?.race,
    affiliation: character?.affiliation,
    locked: true,
    selectedAt: Date.now(),
  });

  if (!selected) {
    throw new Error("No pude guardar ese personaje en tu perfil.");
  }

  user.character = selected;
  return selected;
}

function addExperience(user, amount) {
  let gain = Math.max(0, Number(amount || 0));
  let leveledUp = 0;

  while (gain > 0) {
    const required = getRequiredExp(user.level);
    const needed = required - user.exp;
    if (gain >= needed) {
      gain -= needed;
      user.level += 1;
      user.exp = 0;
      user.power += 80 + user.level * 5;
      user.ki = Math.min(getMaxKi(user), user.ki + 25);
      user.health = Math.min(getMaxHealth(user), user.health + 18);
      leveledUp += 1;
    } else {
      user.exp += gain;
      gain = 0;
    }
  }

  syncVitals(user);
  return leveledUp;
}

function ensureMissionForUser(user) {
  const now = Date.now();
  if (user.mission && Number(user.mission.expiresAt || 0) > now && !user.mission.claimed) {
    return user.mission;
  }

  const template = randomItem(MISSIONS);
  user.mission = {
    code: template.code,
    title: template.title,
    target: template.target,
    progress: 0,
    reward: Object.assign({}, template.reward),
    assignedAt: now,
    expiresAt: now + MISSION_DURATION_MS,
    completed: false,
    claimed: false,
  };
  return user.mission;
}

function progressMission(user, code, amount = 1) {
  const mission = ensureMissionForUser(user);
  if (mission.claimed || mission.code !== code) return mission;

  mission.progress = Math.min(mission.target, mission.progress + Number(amount || 0));
  if (mission.progress >= mission.target) {
    mission.completed = true;
  }
  return mission;
}

function claimMission(user) {
  const mission = ensureMissionForUser(user);
  if (!mission.completed) {
    return { ok: false, message: "Tu mision aun no esta completa.", mission };
  }
  if (mission.claimed) {
    return { ok: false, message: "La recompensa de esta mision ya fue reclamada.", mission };
  }

  user.zeni += Number(mission.reward.zeni || 0);
  user.power += Number(mission.reward.power || 0);
  const leveledUp = addExperience(user, Number(mission.reward.exp || 0));
  user.stats.missionsDone += 1;
  mission.claimed = true;

  return { ok: true, mission, leveledUp, reward: mission.reward };
}

function chooseRace(user, raceKey) {
  const key = String(raceKey || "").trim().toLowerCase();
  if (!RACES[key]) {
    throw new Error("Raza invalida. Usa: saiyajin, namekiano, androide, dios, angel o humano.");
  }

  user.race = key;
  user.health = getMaxHealth(user);
  user.ki = getMaxKi(user);
  if (!getTransformationOptions(user).some((item) => item.name === user.transformation)) {
    user.transformation = "Base";
  }
  return RACES[key];
}

function transformUser(user, target) {
  const wanted = String(target || "").trim().toLowerCase();
  const available = getTransformationOptions(user);

  if (!wanted) {
    return { changed: false, available, current: getTransformationData(user) };
  }

  const transformation =
    available.find((item) => item.key === wanted) ||
    available.find((item) => item.name.toLowerCase() === wanted);

  if (!transformation) {
    throw new Error("No tienes esa transformacion disponible todavia.");
  }

  user.transformation = transformation.name;
  return { changed: true, transformation, available };
}

function getCooldownRemaining(until) {
  return Math.max(0, Math.ceil((Number(until || 0) - Date.now()) / 1000));
}

function trainUser(user) {
  const remaining = getCooldownRemaining(user.cooldowns.train);
  if (remaining > 0) {
    return { ok: false, cooldown: remaining };
  }

  const powerGain = randomInt(70, 180);
  const expGain = randomInt(85, 160);
  const zeniGain = randomInt(90, 180) + Number(user.inventory.capsule || 0) * 20;
  const kiGain = randomInt(18, 40);
  const healthGain = randomInt(10, 22);

  user.power += powerGain;
  user.zeni += zeniGain;
  user.ki = Math.min(getMaxKi(user), user.ki + kiGain);
  user.health = Math.min(getMaxHealth(user), user.health + healthGain);
  user.stats.trainings += 1;
  user.cooldowns.train = Date.now() + TRAIN_COOLDOWN_MS;
  const leveledUp = addExperience(user, expGain);
  progressMission(user, "train", 1);

  return { ok: true, powerGain, expGain, zeniGain, kiGain, healthGain, leveledUp };
}

function searchDragonBall(user) {
  const remaining = getCooldownRemaining(user.cooldowns.dragonBall);
  if (remaining > 0) {
    return { ok: false, cooldown: remaining };
  }

  const current = uniqueSortedNumbers(user.dragonBalls);
  if (current.length >= 7) {
    return { ok: false, complete: true };
  }

  const available = DRAGON_BALLS.filter((item) => !current.includes(item));
  const hasRadar = Number(user.inventory.radar || 0) > 0;
  const chance = hasRadar ? 0.9 : 0.55;
  user.cooldowns.dragonBall = Date.now() + DRAGON_BALL_COOLDOWN_MS;

  if (Math.random() > chance) {
    if (hasRadar) user.inventory.radar -= 1;
    return { ok: false, found: false, usedRadar: hasRadar };
  }

  const found = randomItem(available);
  if (hasRadar) user.inventory.radar -= 1;
  user.dragonBalls = uniqueSortedNumbers([...current, found]);
  user.stats.dragonBallsFound += 1;
  user.zeni += randomInt(80, 140);
  progressMission(user, "dragonball", 1);

  return { ok: true, found: true, ball: found, usedRadar: hasRadar, total: user.dragonBalls.length };
}

function summonShenlong(user, wishKey) {
  const remaining = getCooldownRemaining(user.lastWishAt + SHENLONG_COOLDOWN_MS);
  if (remaining > 0) {
    return { ok: false, cooldown: remaining };
  }
  if (uniqueSortedNumbers(user.dragonBalls).length < 7) {
    return { ok: false, needBalls: true };
  }

  const wish = SHENLONG_WISHES[String(wishKey || "").trim().toLowerCase()];
  if (!wish) {
    return { ok: false, invalid: true, wishes: Object.keys(SHENLONG_WISHES) };
  }

  let result = null;
  if (wish.key === "zeni") {
    const amount = randomInt(1800, 2600);
    user.zeni += amount;
    result = { zeni: amount };
  } else if (wish.key === "poder") {
    const power = randomInt(550, 900);
    const exp = randomInt(180, 260);
    user.power += power;
    result = { power, exp, leveledUp: addExperience(user, exp) };
  } else if (wish.key === "semillas") {
    const senzu = randomInt(2, 4);
    const radar = randomInt(1, 3);
    user.inventory.senzu += senzu;
    user.inventory.radar += radar;
    result = { senzu, radar };
  } else if (wish.key === "nivel") {
    const exp = randomInt(340, 480);
    const zeni = randomInt(600, 900);
    user.zeni += zeni;
    result = { exp, zeni, leveledUp: addExperience(user, exp) };
  }

  user.dragonBalls = [];
  user.lastWishAt = Date.now();
  user.stats.wishes += 1;

  return { ok: true, wish, result };
}

function getBattleScore(user) {
  const effectivePower = getEffectivePower(user);
  const kiFactor = Math.max(30, user.ki) * 3;
  const healthFactor = Math.max(30, user.health) * 2;
  const randomFactor = randomInt(0, Math.max(120, Math.floor(effectivePower * 0.18)));
  return effectivePower + kiFactor + healthFactor + randomFactor;
}

function resolveBattle(userA, userB) {
  const fighterA = getProfileSummary(userA);
  const fighterB = getProfileSummary(userB);
  const scoreA = getBattleScore(userA);
  const scoreB = getBattleScore(userB);
  const winnerUser = scoreA >= scoreB ? userA : userB;
  const loserUser = winnerUser === userA ? userB : userA;
  const winnerProfile = winnerUser === userA ? fighterA : fighterB;
  const loserProfile = loserUser === userA ? fighterA : fighterB;

  const prize = randomInt(220, 420);
  const expWin = randomInt(150, 230);
  const expLose = randomInt(65, 120);

  winnerUser.zeni += prize;
  loserUser.zeni += Math.floor(prize * 0.25);
  winnerUser.stats.wins += 1;
  loserUser.stats.losses += 1;
  const winnerLevelUps = addExperience(winnerUser, expWin);
  const loserLevelUps = addExperience(loserUser, expLose);
  winnerUser.health = Math.max(25, winnerUser.health - randomInt(8, 18));
  winnerUser.ki = Math.max(15, winnerUser.ki - randomInt(10, 20));
  loserUser.health = Math.max(15, loserUser.health - randomInt(18, 32));
  loserUser.ki = Math.max(10, loserUser.ki - randomInt(15, 30));

  progressMission(winnerUser, "battle", 1);

  return {
    winnerUser,
    loserUser,
    winnerProfile,
    loserProfile,
    prize,
    expWin,
    expLose,
    winnerLevelUps,
    loserLevelUps,
    scoreA,
    scoreB,
  };
}

function buildFusionName(userA, userB) {
  const raceA = getRaceData(userA).name;
  const raceB = getRaceData(userB).name;
  if (userA.race === "saiyajin" && userB.race === "saiyajin") return "Gogeta";
  if (userA.race === "angel" || userB.race === "angel") return "WhisFusion";
  if (userA.race === "dios" || userB.race === "dios") return "Fusion Hakai";
  if (raceA === raceB) return `Fusion ${raceA}`;
  return "Fusion Z";
}

function createFusion(userA, userB, jidA, jidB) {
  const remaining = Math.max(
    getCooldownRemaining(userA.cooldowns.fusion),
    getCooldownRemaining(userB.cooldowns.fusion),
  );
  if (remaining > 0) {
    return { ok: false, cooldown: remaining };
  }

  const fusionName = buildFusionName(userA, userB);
  const multiplier = 1.3;
  const expiresAt = Date.now() + FUSION_DURATION_MS;

  userA.fusion = { with: jidB, name: fusionName, multiplier, expiresAt };
  userB.fusion = { with: jidA, name: fusionName, multiplier, expiresAt };
  userA.cooldowns.fusion = Date.now() + FUSION_COOLDOWN_MS;
  userB.cooldowns.fusion = Date.now() + FUSION_COOLDOWN_MS;

  return { ok: true, fusionName, multiplier, expiresAt };
}

function ensureBoss(chatData) {
  const boss = chatData.boss;
  if (boss && boss.hp > 0 && Number(boss.expiresAt || 0) > Date.now()) {
    return boss;
  }

  const template = randomItem(BOSSES);
  chatData.boss = {
    name: template.name,
    hp: template.hp,
    maxHp: template.hp,
    reward: template.reward,
    power: template.power,
    createdAt: Date.now(),
    expiresAt: Date.now() + 45 * 60 * 1000,
    contributors: {},
  };
  return chatData.boss;
}

function getBoss(chatData) {
  const boss = chatData.boss;
  if (!boss) return null;
  if (boss.hp <= 0 || Number(boss.expiresAt || 0) <= Date.now()) {
    chatData.boss = null;
    return null;
  }
  return boss;
}

function rewardBossContributors(chatData) {
  const boss = chatData.boss;
  if (!boss) return [];

  const contributors = Object.entries(boss.contributors || {}).sort((left, right) => right[1] - left[1]);
  const totalParticipants = contributors.length || 1;
  const rewards = [];

  contributors.forEach(([jid, damage], index) => {
    const user = ensureUserData(jid);
    const topBonus = index === 0 ? 250 : 0;
    const zeni = Math.floor(boss.reward / totalParticipants) + topBonus;
    const exp = Math.floor(180 + Number(damage || 0) / 12);
    user.zeni += zeni;
    const leveledUp = addExperience(user, exp);
    rewards.push({ jid, damage, zeni, exp, leveledUp });
  });

  chatData.boss = null;
  return rewards;
}

function attackBoss(user, chatData, action) {
  const boss = ensureBoss(chatData);
  syncVitals(user);

  if (action === "charge") {
    const kiGain = randomInt(25, 45);
    user.ki = Math.min(getMaxKi(user), user.ki + kiGain);
    progressMission(user, "boss", 1);
    return { ok: true, action: "charge", boss, kiGain };
  }

  if (action === "heal") {
    if (Number(user.inventory.senzu || 0) <= 0) {
      return { ok: false, action: "heal", needItem: true };
    }
    user.inventory.senzu -= 1;
    user.health = getMaxHealth(user);
    user.ki = getMaxKi(user);
    progressMission(user, "boss", 1);
    return { ok: true, action: "heal", boss, healed: true };
  }

  const cost = randomInt(18, 35);
  if (user.ki < cost) {
    return { ok: false, action: "attack", needKi: true, boss };
  }

  user.ki -= cost;
  const damage = Math.max(180, Math.floor(getEffectivePower(user) * (0.12 + Math.random() * 0.08)));
  boss.hp = Math.max(0, boss.hp - damage);
  boss.contributors = boss.contributors || {};
  const userKey = user.jid || "self";
  boss.contributors[userKey] = Number(boss.contributors[userKey] || 0) + damage;
  user.stats.bossDamage += damage;
  progressMission(user, "boss", 1);

  const finished = boss.hp <= 0;
  const rewards = finished ? rewardBossContributors(chatData) : [];

  return { ok: true, action: "attack", boss: finished ? null : boss, damage, finished, rewards };
}

function createTrivia(chatData, mode) {
  const current = chatData.trivia;
  if (current && Number(current.expiresAt || 0) > Date.now()) {
    return current;
  }

  if (mode === "guess") {
    const item = randomItem(GUESS_ITEMS);
    chatData.trivia = {
      mode: "guess",
      prompt: item.prompt,
      answer: item.answer,
      aliases: item.aliases || [],
      reward: { zeni: 260, exp: 110, power: 70 },
      expiresAt: Date.now() + TRIVIA_DURATION_MS,
    };
    return chatData.trivia;
  }

  const item = randomItem(TRIVIA_ITEMS);
  chatData.trivia = {
    mode: "trivia",
    question: item.question,
    options: item.options,
    answerIndex: item.answerIndex,
    answer: item.options[item.answerIndex],
    reward: { zeni: 320, exp: 130, power: 80 },
    expiresAt: Date.now() + TRIVIA_DURATION_MS,
  };
  return chatData.trivia;
}

function answerTrivia(user, chatData, input) {
  const current = chatData.trivia;
  if (!current || Number(current.expiresAt || 0) <= Date.now()) {
    chatData.trivia = null;
    return { ok: false, expired: true };
  }

  const answer = String(input || "").trim().toLowerCase();
  if (!answer) {
    return { ok: false, empty: true, current };
  }

  let success = false;
  if (current.mode === "trivia") {
    const letters = ["a", "b", "c", "d"];
    const letterIndex = letters.indexOf(answer);
    success =
      letterIndex === current.answerIndex ||
      String(current.answer || "").trim().toLowerCase() === answer;
  } else {
    const aliases = [current.answer, ...(current.aliases || [])]
      .map((value) => String(value || "").trim().toLowerCase())
      .filter(Boolean);
    success = aliases.includes(answer);
  }

  if (!success) {
    return { ok: false, wrong: true, current };
  }

  user.zeni += Number(current.reward.zeni || 0);
  user.power += Number(current.reward.power || 0);
  const leveledUp = addExperience(user, Number(current.reward.exp || 0));
  user.stats.triviaCorrect += 1;
  progressMission(user, "trivia", 1);
  const resolved = chatData.trivia;
  chatData.trivia = null;

  return { ok: true, trivia: resolved, leveledUp };
}

function createTournament(chatData, hostJid) {
  if (chatData.tournament && Number(chatData.tournament.expiresAt || 0) > Date.now()) {
    throw new Error("Ya hay un torneo activo en este chat.");
  }

  chatData.tournament = {
    status: "open",
    host: hostJid,
    participants: [hostJid],
    createdAt: Date.now(),
    expiresAt: Date.now() + TOURNAMENT_DURATION_MS,
  };
  return chatData.tournament;
}

function getTournament(chatData) {
  const tournament = chatData.tournament;
  if (!tournament) return null;
  if (Number(tournament.expiresAt || 0) <= Date.now()) {
    chatData.tournament = null;
    return null;
  }
  return tournament;
}

function joinTournament(chatData, jid) {
  const tournament = getTournament(chatData);
  if (!tournament) throw new Error("No hay torneo abierto.");
  if (tournament.status !== "open") throw new Error("Ese torneo ya no acepta participantes.");
  if (!tournament.participants.includes(jid)) {
    tournament.participants.push(jid);
  }
  return tournament;
}

function leaveTournament(chatData, jid) {
  const tournament = getTournament(chatData);
  if (!tournament) throw new Error("No hay torneo activo.");
  tournament.participants = tournament.participants.filter((item) => item !== jid);
  if (!tournament.participants.length) {
    chatData.tournament = null;
    return null;
  }
  return tournament;
}

function runTournament(chatData) {
  const tournament = getTournament(chatData);
  if (!tournament) throw new Error("No hay torneo activo.");
  if (tournament.participants.length < 2) {
    throw new Error("Necesitas al menos 2 participantes para iniciar el torneo.");
  }

  let fighters = [...tournament.participants];
  const rounds = [];

  while (fighters.length > 1) {
    const winners = [];
    const lines = [];

    for (let index = 0; index < fighters.length; index += 2) {
      const first = fighters[index];
      const second = fighters[index + 1];
      if (!second) {
        winners.push(first);
        lines.push(`@${first.split("@")[0]} avanza sin rival.`);
        continue;
      }

      const firstUser = ensureUserData(first);
      const secondUser = ensureUserData(second);
      const duel = resolveBattle(firstUser, secondUser);
      const winnerJid = duel.winnerUser === firstUser ? first : second;
      const loserJid = winnerJid === first ? second : first;
      winners.push(winnerJid);
      lines.push(`@${winnerJid.split("@")[0]} derrota a @${loserJid.split("@")[0]} y sigue en el torneo.`);
    }

    fighters = winners;
    rounds.push(lines);
  }

  const championJid = fighters[0];
  const champion = ensureUserData(championJid);
  champion.zeni += 1400;
  const levelUps = addExperience(champion, 320);
  chatData.tournament = null;

  return { championJid, rounds, reward: { zeni: 1400, exp: 320, levelUps } };
}

function buyItem(user, itemKey, quantity = 1) {
  const key = String(itemKey || "").trim().toLowerCase();
  const item = SHOP_ITEMS[key];
  if (!item) throw new Error("Ese item no existe en la shop.");

  const amount = Math.max(1, Number(quantity || 1));
  const total = item.price * amount;
  if (user.zeni < total) throw new Error("No tienes suficiente zeni.");

  user.zeni -= total;
  user.inventory[key] = Number(user.inventory[key] || 0) + amount;
  return { item, amount, total };
}

function formatReward(reward = {}) {
  const parts = [];
  if (reward.zeni) parts.push(`${reward.zeni} zeni`);
  if (reward.exp) parts.push(`${reward.exp} exp`);
  if (reward.power) parts.push(`${reward.power} poder`);
  if (reward.senzu) parts.push(`${reward.senzu} semillas`);
  if (reward.radar) parts.push(`${reward.radar} radares`);
  return parts.join(", ") || "sin cambios";
}

function formatTimeMs(ms) {
  const value = Math.max(0, Number(ms || 0));
  const totalSeconds = Math.ceil(value / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const restMinutes = minutes % 60;
    return `${hours}h ${restMinutes}m`;
  }
  return `${minutes}m ${seconds}s`;
}

module.exports = {
  RACES,
  TRANSFORMATIONS,
  SHOP_ITEMS,
  SHENLONG_WISHES,
  QUOTES,
  ATTACKS,
  DRAGON_BALLS,
  ensureUserData,
  ensureChatData,
  getProfileSummary,
  lockProfileCharacter,
  getTransformationOptions,
  getTransformationData,
  getEffectivePower,
  getMaxKi,
  getMaxHealth,
  getRequiredExp,
  ensureMissionForUser,
  progressMission,
  claimMission,
  chooseRace,
  transformUser,
  trainUser,
  searchDragonBall,
  summonShenlong,
  resolveBattle,
  createFusion,
  ensureBoss,
  getBoss,
  attackBoss,
  createTrivia,
  answerTrivia,
  createTournament,
  getTournament,
  joinTournament,
  leaveTournament,
  runTournament,
  buyItem,
  randomItem,
  formatReward,
  formatTimeMs,
  getCooldownRemaining,
};
