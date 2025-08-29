const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearwarns')
        .setDescription('Clear all warnings from a member.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The member to clear their warnings.')
                .setRequired(true)),

    async execute(interaction) {
        const staffRole = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === "staff");
        if (!staffRole) {
            return interaction.reply({ content: "❌ Staff role not found on this server.", ephemeral: true });
        }

        if (!interaction.member.roles.cache.has(staffRole.id)) {
            return interaction.reply({ content: "❌ You don't have permission to use this command.", ephemeral: true });
        }

        const target = interaction.options.getUser('target');

        let warnings = {};
        if (fs.existsSync('warnings.json')) {
            warnings = JSON.parse(fs.readFileSync('warnings.json', 'utf8'));
        }

        if (!warnings[target.id] || warnings[target.id].length === 0) {
            return interaction.reply({ content: `✅ No warnings found for ${target.tag}.`, ephemeral: false });
        }

        delete warnings[target.id];
        fs.writeFileSync('warnings.json', JSON.stringify(warnings, null, 2));

        let cases = { count: 0 };
        if (fs.existsSync('cases.json')) {
            cases = JSON.parse(fs.readFileSync('cases.json', 'utf8'));
        }

        cases.count = (cases.count || 0) + 1;
        fs.writeFileSync('cases.json', JSON.stringify(cases, null, 2));

        const logChannel = interaction.guild.channels.cache.find(ch => ch.name === '🏴│moderation-logs');
        if (logChannel) {
            const embed = new EmbedBuilder()
                .setColor('#00FF00') // Green
                .setTitle('🧹 Warnings Cleared')
                .addFields(
                    { name: 'Case', value: `${cases.count}`, inline: true },
                    { name: 'User', value: `${target.tag}`, inline: true },
                    { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
                    { name: 'Time (UTC)', value: new Date().toUTCString(), inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Moderation Log', iconURL: interaction.guild.iconURL() });

            logChannel.send({ embeds: [embed] });
        }

        return interaction.reply({ content: `✅ Cleared all warnings for ${target.tag}.`, ephemeral: false });
    }
};
