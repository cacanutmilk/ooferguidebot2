// messageCreate.js
const { Events, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

// === Configuration ===
const PROTECTED_USER_IDS = [
  '700341168927539230',
  '761949400557682719',
  '1225855414936010864',
];
const BYPASS_ROLES = ['Mutuals', 'Trusted', 'Staff', 'Content Creator'];
const EASTER_EGG_PREFIX = '-c';
const EASTER_EGG_BYPASS_USER = '941309399341887529'; // Master override

// === Cooldowns ===
const ownershipPingCooldown = new Collection();
const botPingCooldown = new Collection();
const easterEggTimestamps = new Collection();

// === Load Easter Eggs ===
const EASTER_EGGS_PATH = path.join(__dirname, '../../eastereggs');
const easterEggs = new Map();

fs.readdirSync(EASTER_EGGS_PATH).forEach((file) => {
  if (file.endsWith('.js')) {
    const egg = require(path.join(EASTER_EGGS_PATH, file));
    if (egg?.name && typeof egg.execute === 'function') {
      easterEggs.set(egg.name.toLowerCase(), egg);
    }
  }
});

module.exports = {
  name: Events.MessageCreate,

  async execute(message) {
    if (!message.guild || message.author.bot) return;

    const now = Date.now();
    const member = message.member;
    const memberRoles = member?.roles?.cache || new Collection();

    const isBypassed = BYPASS_ROLES.some((role) =>
      memberRoles.some((r) => r.name === role)
    );
    const isStaff = memberRoles.some((r) => r.name === 'Staff');

    // === Ownership Ping Handling ===
    if (
      message.mentions.users.some((u) => PROTECTED_USER_IDS.includes(u.id)) &&
      message.type !== 19 &&
      !isBypassed
    ) {
      const lastTime = ownershipPingCooldown.get(message.author.id);
      if (!lastTime || now - lastTime > 5000) {
        ownershipPingCooldown.set(message.author.id, now);
        await message.channel.send({
          content: [
            `<@${message.author.id}>, Oops! You pinged our ownership.`,
            `If you need help, ping a staff member or create a ticket.`,
            `Repeated pings may result in moderation action.`,
            `Thanks for understanding!`,
          ].join('\n'),
        });
      }
    }

    // === Bot Mention Handling ===
    if (
      message.mentions.users.has(message.client.user.id) &&
      message.type !== 19
    ) {
      const lastTime = botPingCooldown.get(message.author.id);
      if (!lastTime || now - lastTime > 10000) {
        botPingCooldown.set(message.author.id, now);
        await message.channel.send({
          content: `Hello, ${message.author}!\nNeed help? Open a ticket or ping staff.\nPlease avoid pinging ownership directly.`,
        });
      }
    }

    // === Easter Egg Commands ===
    if (!message.content.startsWith(EASTER_EGG_PREFIX)) return;

    const args = message.content.slice(EASTER_EGG_PREFIX.length).trim().split(/\s+/);
    const cmdName = args.shift()?.toLowerCase();
    const egg = easterEggs.get(cmdName);
    if (!egg) return;

    const isEggBypass = message.author.id === EASTER_EGG_BYPASS_USER;

    // Cooldown handling (non-staff, non-bypass)
    if (!isStaff && !isEggBypass) {
      const userId = message.author.id;
      const timestamps = easterEggTimestamps.get(userId) || [];
      const recent = timestamps.filter((ts) => now - ts < 5000);

      recent.push(now);
      easterEggTimestamps.set(userId, recent);

      if (recent.length >= 3) {
        return message.reply({
          content: "⚠️ You're using this command too quickly. Please slow down.",
          allowedMentions: { repliedUser: false },
        });
      }

      if (recent.length >= 2 && now - recent[recent.length - 2] < 5000) {
        return message.reply({
          content: "⏳ Please wait a few seconds before using that again.",
          allowedMentions: { repliedUser: false },
        });
      }
    }

    // === Execute Easter Egg ===
    try {
      if (egg.userId) {
        // Restricted egg (userId check)
        if (isEggBypass || message.author.id === egg.userId) {
          await egg.execute(message, args);
        }
      } else {
        // Chance-based or open egg
        if (!egg.chance || Math.random() <= egg.chance) {
          await egg.execute(message, args);
        }
      }
    } catch (err) {
      console.error(`Error executing Easter Egg "${cmdName}":`, err);
    }
  },
};
