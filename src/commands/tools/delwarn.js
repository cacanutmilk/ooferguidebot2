const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delwarn')
        .setDescription('Delete a specific warning from a member.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The member to delete their warning')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('warn_id')
                .setDescription('The ID of the warning to delete')
                .setRequired(true)),

    async execute(interaction) {
        // Check staff role
        const staffRole = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === "staff");
        if (!staffRole || !interaction.member.roles.cache.has(staffRole.id)) {
            return interaction.reply({ content: "❌ You don't have permission to use this command.", ephemeral: true });
        }

        const target = interaction.options.getUser('target');
        const warnId = interaction.options.getInteger('warn_id');

        const warnsPath = path.join(__dirname, '../../../warnings.json');
        if (!fs.existsSync(warnsPath)) return interaction.reply({ content: '❌ No warnings file found.', ephemeral: true });

        const warnings = JSON.parse(fs.readFileSync(warnsPath, 'utf8'));
        const userWarns = warnings[target.id];

        if (!userWarns || userWarns.length < warnId || warnId <= 0) 
            return interaction.reply({ content: `❌ Warning ID ${warnId} not found for ${target.tag}.`, ephemeral: true });

        const removed = userWarns.splice(warnId - 1, 1);
        warnings[target.id] = userWarns;

        fs.writeFileSync(warnsPath, JSON.stringify(warnings, null, 2));

        // Increment cases
        const casesPath = path.join(__dirname, '../../../cases.json');
        let cases = { count: 0 };
        if (fs.existsSync(casesPath)) cases = JSON.parse(fs.readFileSync(casesPath, 'utf8'));
        cases.count = (cases.count || 0) + 1;
        fs.writeFileSync(casesPath, JSON.stringify(cases, null, 2));

        // Log the deletion
        const logChannel = interaction.guild.channels.cache.find(ch => ch.name === '🏴│moderation-logs');
        if (logChannel) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🗑️ Warning Deleted')
                .addFields(
                    { name: 'Case', value: `${cases.count}`, inline: true },
                    { name: 'User', value: `${target.tag}`, inline: true },
                    { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
                    { name: 'Time (UTC)', value: new Date().toISOString(), inline: true },
                    { name: 'Removed Reason', value: removed[0].reason }
                )
                .setTimestamp()
                .setFooter({ text: 'Moderation Log', iconURL: interaction.guild.iconURL() });

            logChannel.send({ embeds: [embed] });
        }

        await interaction.reply({ content: `✅ Deleted warning ID ${warnId} for ${target.tag}.`, ephemeral: true });
    }
};
