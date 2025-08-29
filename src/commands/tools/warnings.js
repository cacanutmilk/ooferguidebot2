const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('Check warnings of a member.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The member to check their warnings.')
                .setRequired(true)),
    async execute(interaction) {
        const staffRoleName = "Staff"; // change to your staff role name
        const member = interaction.member;

        // Check if the user has the Staff role
        if (!member.roles.cache.some(role => role.name === staffRoleName)) {
            return interaction.reply({ content: "❌ You do not have permission to use this command.", ephemeral: true });
        }

        const target = interaction.options.getUser('target');

        let warnings = {};
        if (fs.existsSync('warnings.json')) {
            warnings = JSON.parse(fs.readFileSync('warnings.json', 'utf8'));
        }

        if (!warnings[target.id] || warnings[target.id].length === 0) {
            const embed = new EmbedBuilder()
                .setColor('#00FF00') // 🟢 Green
                .setTitle(`📋 Warnings for ${target.tag}`)
                .setDescription(`✅ No warnings found.`)
                .setTimestamp()
                .setFooter({ text: 'Moderation Overlay', iconURL: interaction.guild.iconURL() });

            return interaction.reply({ embeds: [embed], ephemeral: false });
        }

        // Convert stored UTC times to readable format
        const warnList = warnings[target.id]
            .map((w, i) => {
                let time = new Date(w.time);
                // Format in UTC, 12h, AM/PM
                let formatted = time.toLocaleString('en-US', { 
                    timeZone: 'UTC',
                    hour12: true,
                    year: 'numeric',
                    month: 'short',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
                return `**${i + 1}.**  Reason: ${w.reason}\n Moderator: ${w.moderator}\n Time (UTC): ${formatted}`;
            })
            .join("\n\n");

        const embed = new EmbedBuilder()
            .setColor('#00FF00') // 🟢 Green
            .setTitle(`📋 Warnings for ${target.tag}`)
            .setDescription(warnList)
            .setTimestamp()
            .setFooter({ text: 'Moderation Overlay', iconURL: interaction.guild.iconURL() });

        return interaction.reply({ embeds: [embed], ephemeral: false });
    }
};
