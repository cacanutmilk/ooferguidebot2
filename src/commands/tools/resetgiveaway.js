const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const giveawaysFile = path.join(__dirname, '../../data/giveawayCreate.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resetgiveaway')
        .setDescription('🗑️ Reset all active giveaways'),

    async execute(interaction) {
        const allowedRoles = ['Management Fish', 'Community Holder', 'Goldfish'];
        const memberRoles = interaction.member.roles.cache.map(r => r.name);

        const hasPermission = allowedRoles.some(role => memberRoles.includes(role));
        if (!hasPermission) {
            return interaction.reply({ content: "❌ You don't have permission to use this command.", ephemeral: true });
        }

        if (!fs.existsSync(giveawaysFile)) {
            fs.writeFileSync(giveawaysFile, JSON.stringify([]));
        } else {
            fs.writeFileSync(giveawaysFile, JSON.stringify([])); // Clear all giveaways
        }

        // Log the reset to moderation-logs
        const logChannel = interaction.guild.channels.cache.find(ch => ch.name === '🏴│moderation-logs');
        if (logChannel) {
            const logEmbed = new EmbedBuilder()
                .setTitle("🗑️ Giveaways Reset")
                .setColor('#3498db')
                .addFields(
                    { name: "Staff", value: `${interaction.user.tag}`, inline: true },
                    { name: "Action", value: "All giveaways have been cleared", inline: true }
                )
                .setTimestamp();
            logChannel.send({ embeds: [logEmbed] });
        }

        return interaction.reply({ content: "✅ All giveaways have been reset.", ephemeral: true });
    }
};
