const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const ms = require("ms");
const fs = require("fs");
const path = require("path");

const giveawaysFile = path.join(__dirname, "../../data/giveawayCreate.json");

function loadGiveaways() {
    if (!fs.existsSync(giveawaysFile)) return [];
    return JSON.parse(fs.readFileSync(giveawaysFile, "utf8"));
}

function saveGiveaways(giveaways) {
    fs.writeFileSync(giveawaysFile, JSON.stringify(giveaways, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("giveawaycreate")
        .setDescription("Create a giveaway")
        .addChannelOption(option =>
            option.setName("channel")
                .setDescription("Channel for giveaway")
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName("winners")
                .setDescription("Number of winners")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("duration")
                .setDescription("Duration (e.g., 1h, 30m)")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("prize")
                .setDescription("Giveaway prize")
                .setRequired(true)),

    async execute(interaction) {
        const staffRole = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === "staff");
        if (!staffRole || !interaction.member.roles.cache.has(staffRole.id)) {
            return interaction.reply({ content: "❌ Staff only.", ephemeral: true });
        }

        const channel = interaction.options.getChannel("channel");
        const winnersCount = interaction.options.getInteger("winners");
        const duration = interaction.options.getString("duration");
        const prize = interaction.options.getString("prize");
        const endTime = Date.now() + ms(duration);

        const embed = new EmbedBuilder()
            .setTitle("🎉 Giveaway 🎉")
            .setDescription(`**Prize:** ${prize}\nReact with 🎉 to enter!\n**Winners:** ${winnersCount}\n**Ends:** <t:${Math.floor(endTime / 1000)}:R>`)
            .setColor("#3498db");

        const giveawayMessage = await channel.send({ embeds: [embed] });
        await giveawayMessage.react("🎉");

        let giveaways = loadGiveaways();
        giveaways.push({
            guildId: interaction.guild.id,
            channelId: channel.id,
            messageId: giveawayMessage.id,
            messageLink: `https://discord.com/channels/${interaction.guild.id}/${channel.id}/${giveawayMessage.id}`,
            prize,
            winners: winnersCount,
            endTime,
            ended: false
        });
        saveGiveaways(giveaways);

        const logChannel = interaction.guild.channels.cache.find(ch => ch.name === '🏴│moderation-logs');
        if (logChannel) {
            const logEmbed = new EmbedBuilder()
                .setTitle("📢 Giveaway Created")
                .setColor("#3498db")
                .addFields(
                    { name: "Staff", value: `${interaction.user.tag}`, inline: true },
                    { name: "Channel", value: `${channel}`, inline: true },
                    { name: "Prize", value: `${prize}`, inline: true },
                    { name: "Duration", value: `${duration}`, inline: true },
                    { name: "Winners", value: `${winnersCount}`, inline: true },
                    { name: "Message Link", value: `[Go to message](${giveaways[giveaways.length - 1].messageLink})` }
                )
                .setTimestamp();
            logChannel.send({ embeds: [logEmbed] });
        }

        await interaction.reply({ content: `✅ Giveaway started in ${channel}`, ephemeral: true });

        // Automatic end
        setTimeout(async () => {
            try {
                const fetchedMsg = await channel.messages.fetch(giveawayMessage.id);
                const reactions = await fetchedMsg.reactions.cache.get("🎉")?.users.fetch();
                const participants = reactions ? reactions.filter(u => !u.bot) : new Map();

                let winners = [];
                if (participants.size > 0) {
                    winners = Array.from(participants.values()).sort(() => 0.5 - Math.random()).slice(0, winnersCount);
                }

                await channel.send(
                    winners.length > 0
                        ? `🎉 Congratulations ${winners.map(w => `<@${w.id}>`).join(", ")}! You won **${prize}**`
                        : "❌ No valid entries, no winners could be chosen."
                );

                const endedEmbed = new EmbedBuilder()
                    .setTitle("🎉 Giveaway Ended 🎉")
                    .setDescription(`**Prize:** ${prize}\n**Ended:** <t:${Math.floor(Date.now() / 1000)}:F>`)
                    .setColor("#3498db");
                await fetchedMsg.edit({ embeds: [endedEmbed] });

                let giveaways = loadGiveaways();
                const g = giveaways.find(g => g.messageId === giveawayMessage.id);
                if (g) g.ended = true;
                saveGiveaways(giveaways);
            } catch (err) {
                console.error("Error ending giveaway:", err);
            }
        }, ms(duration));
    }
};
