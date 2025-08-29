const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban a user.')
        .addStringOption(option =>
            option.setName('userid')
                .setDescription('ID of the user to unban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for unban')
                .setRequired(true)),

    async execute(interaction) {
        const staffRole = interaction.guild.roles.cache.find(r => r.name?.toLowerCase() === 'staff');
        if (!staffRole || !interaction.member.roles.cache.has(staffRole.id)) {
            return interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
        }

        const userId = interaction.options.getString('userid');
        const reason = interaction.options.getString('reason');
        const moderator = interaction.user;

        const logChannel = interaction.guild.channels.cache.find(ch => ch.name === '🏴│moderation-logs');

        try {
            // 🔓 Unban using Discord built-in
            await interaction.guild.members.unban(userId, reason);

            // 🔢 Increment case number
            const casesPath = path.join(__dirname, '../../../cases.json');
            let cases = fs.existsSync(casesPath)
                ? JSON.parse(fs.readFileSync(casesPath, 'utf8'))
                : { count: 0 };

            cases.count = (cases.count || 0) + 1;
            fs.writeFileSync(casesPath, JSON.stringify(cases, null, 2));

            // 📢 Send log embed
            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('✅ User Unbanned')
                    .addFields(
                        { name: 'Case', value: `${cases.count}`, inline: true },
                        { name: 'User ID', value: `${userId}`, inline: true },
                        { name: 'Moderator', value: `${moderator.tag}`, inline: true },
                        { name: 'Reason', value: reason, inline: false },
                        { name: 'Time', value: new Date().toUTCString(), inline: false }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Moderation Log', iconURL: interaction.guild.iconURL() || null });

                await logChannel.send({ embeds: [embed] });
            }

            await interaction.reply({ content: `✅ User \`${userId}\` has been unbanned. (Case #${cases.count})`, ephemeral: false });

        } catch (error) {
            console.error(`❌ Failed to unban user ${userId}:`, error);
            await interaction.reply({ content: '❌ Failed to unban the user. Make sure the ID is correct.', ephemeral: true });
        }
    }
};
