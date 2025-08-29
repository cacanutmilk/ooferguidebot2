const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('editwarn')
        .setDescription('Edit a warning of a user')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('User whose warning you want to edit')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('warn_id')
                .setDescription('The warning number to edit')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The new reason for the warning')
                .setRequired(true)),

    async execute(interaction) {
        // Check staff role
        const staffRole = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === 'staff');
        if (!staffRole || !interaction.member.roles.cache.has(staffRole.id))
            return interaction.reply({ content: '❌ Staff only.', ephemeral: true });

        const target = interaction.options.getUser('target');
        const warnId = interaction.options.getInteger('warn_id');
        const newReason = interaction.options.getString('reason');

        // Path to warnings.json at root
        const warnsPath = path.join(__dirname, '../../../warnings.json');
        if (!fs.existsSync(warnsPath)) 
            return interaction.reply({ content: '❌ No warnings file found.', ephemeral: true });

        const warnsData = JSON.parse(fs.readFileSync(warnsPath, 'utf8'));
        const userWarns = warnsData[target.id];

        if (!userWarns || userWarns.length < warnId || warnId <= 0) 
            return interaction.reply({ content: '❌ Warning ID not found.', ephemeral: true });

        // Update the reason and timestamp in UTC
        userWarns[warnId - 1].reason = newReason;
        userWarns[warnId - 1].timestamp = new Date().toISOString();
        warnsData[target.id] = userWarns;

        fs.writeFileSync(warnsPath, JSON.stringify(warnsData, null, 2));

        // Log the edit
        const logChannel = interaction.guild.channels.cache.find(ch => ch.name === '🏴│moderation-logs');
        if (logChannel) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('✏️ Warning Edited')
                .addFields(
                    { name: 'User', value: `<@${target.id}> (${target.id})` },
                    { name: 'Moderator', value: `${interaction.user.tag}` },
                    { name: 'Warning ID', value: `${warnId}` },
                    { name: 'New Reason', value: newReason }
                )
                .setTimestamp()
                .setFooter({ text: 'Moderation Log', iconURL: interaction.guild.iconURL() });
            
            logChannel.send({ embeds: [embed] });
        }

        await interaction.reply({ content: `✅ Warning ID ${warnId} updated for ${target.tag}.`, ephemeral: true });
    }
};
