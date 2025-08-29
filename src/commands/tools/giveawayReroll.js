// giveawayreroll.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const giveawaysFile = path.join(__dirname, "../../data/giveawayCreate.json");

function loadGiveaways() {
    if (!fs.existsSync(giveawaysFile)) return [];
    try {
        return JSON.parse(fs.readFileSync(giveawaysFile, "utf8"));
    } catch {
        return [];
    }
}
function saveGiveaways(giveaways) {
    fs.writeFileSync(giveawaysFile, JSON.stringify(giveaways, null, 2));
}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("giveawayreroll")
        .setDescription("🔄 Reroll a giveaway winner (ID or message link)")
        .addStringOption(option =>
            option.setName("message")
                .setDescription("Message ID or link of the giveaway")
                .setRequired(true)
        ),

    async execute(interaction) {
        // Staff-only check
        const staffRole = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === "staff");
        if (!staffRole || !interaction.member.roles.cache.has(staffRole.id)) {
            return interaction.reply({ content: "❌ Staff only.", ephemeral: true });
        }

        const messageInput = interaction.options.getString("message").trim();

        // Try to extract the last 17-19 digit number (message ID) from input (works with links or IDs)
        const idMatch = messageInput.match(/(\d{17,19})$/);
        // load giveaways early for fallback search by messageLink
        const giveaways = loadGiveaways();

        let messageId = idMatch?.[1];

        // If we couldn't pull an ID from the input, try to find a giveaway with an exact messageLink match
        if (!messageId) {
            const foundByLink = giveaways.find(g => g.messageLink === messageInput);
            if (foundByLink) messageId = foundByLink.messageId;
        }

        if (!messageId) {
            return interaction.reply({ content: "❌ Invalid message ID or link. Provide the message ID or the full message link.", ephemeral: true });
        }

        const giveaway = giveaways.find(g => g.messageId === messageId);
        if (!giveaway) {
            return interaction.reply({ content: "❌ Giveaway not found in storage.", ephemeral: true });
        }

        try {
            const channel = await interaction.guild.channels.fetch(giveaway.channelId);
            if (!channel) return interaction.reply({ content: "❌ Giveaway channel not found.", ephemeral: true });

            const message = await channel.messages.fetch(giveaway.messageId).catch(() => null);
            if (!message) return interaction.reply({ content: "❌ Giveaway message not found (maybe deleted).", ephemeral: true });

            // Get the reaction object (prefer cache.get)
            const reaction = message.reactions.cache.get("🎉") || message.reactions.resolve("🎉");
            if (!reaction) return interaction.reply({ content: "❌ No 🎉 reactions found on the giveaway message.", ephemeral: true });

            const users = await reaction.users.fetch();
            // filter bots and the message author if needed
            const participants = users.filter(u => !u.bot);

            if (!participants || participants.size === 0) {
                return interaction.reply({ content: "❌ No participants to reroll.", ephemeral: true });
            }

            // Convert to array and pick winners
            const participantArray = Array.from(participants.values());
            shuffleArray(participantArray);
            const winners = participantArray.slice(0, Math.max(1, (giveaway.winners || 1)));

            // Announce in the giveaway channel
            await channel.send(`🎉 Rerolled winners: ${winners.map(u => `<@${u.id}>`).join(", ")} for **${giveaway.prize}**`);

            // Log reroll to moderation-logs
            const logChannel = interaction.guild.channels.cache.find(ch => ch.name === "🏴│moderation-logs");
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle("🔄 Giveaway Rerolled")
                    .setColor("#3498db")
                    .addFields(
                        { name: "Staff", value: interaction.user.tag, inline: true },
                        { name: "Prize", value: giveaway.prize ?? "Unknown", inline: true },
                        { name: "Message Link", value: giveaway.messageLink ?? `https://discord.com/channels/${interaction.guild.id}/${giveaway.channelId}/${giveaway.messageId}`, inline: false },
                        { name: "New Winners", value: winners.map(u => `<@${u.id}>`).join(", "), inline: false }
                    )
                    .setTimestamp();
                logChannel.send({ embeds: [logEmbed] }).catch(() => {});
            }

            return interaction.reply({ content: "✅ Giveaway rerolled.", ephemeral: true });
        } catch (err) {
            console.error("giveawayreroll error:", err);
            return interaction.reply({ content: "❌ An error occurred while rerolling. Check console for details.", ephemeral: true });
        }
    }
};
