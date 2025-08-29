const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Unmute a member.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The member to unmute')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for unmuting')
                .setRequired(false)),

    async execute(interaction) {
        const staffRole = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === 'staff');
        if (!interaction.member.roles.cache.has(staffRole?.id)) {
            return interaction.reply({ content: "❌ You don't have permission to use this command.", ephemeral: true });
        }

        const target = interaction.options.getUser('target');
        const member = await interaction.guild.members.fetch(target.id).catch(() => null);
        if (!member) return interaction.reply({ content: '❌ Member not found.', ephemeral: true });

        if (!member.communicationDisabledUntil) {
            return interaction.reply({ content: '⚠️ Member is not muted.', ephemeral: true });
        }

        const reason = interaction.options.getString('reason') || 'No reason provided';
        const moderator = interaction.user;
        const logChannel = interaction.guild.channels.cache.find(ch => ch.name === '🏴│moderation-logs');

        // Remove timeout
        await member.timeout(null, `Unmuted by ${moderator.tag} | Reason: ${reason}`);

        // Handle case logging
        let cases = { count: 0 };
        if (fs.existsSync('cases.json')) {
            cases = JSON.parse(fs.readFileSync('cases.json', 'utf8'));
        }
        cases.count = (cases.count || 0) + 1;
        fs.writeFileSync('cases.json', JSON.stringify(cases, null, 2));

        const { EmbedBuilder } = require('discord.js');

        if (logChannel) {
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🔈 Member Unmuted')
                .setDescription(`Unmute member`)
                .addFields(
                    { name: 'Case', value: `${cases.count}`, inline: true },
                    { name: 'User', value: `${target.tag}`, inline: true },
                    { name: 'Moderator', value: `${moderator.tag}`, inline: true },
                    { name: 'Reason', value: reason }
                )
                .setTimestamp()
                .setFooter({ text: 'Moderation Panel', iconURL: interaction.guild.iconURL() });

            logChannel.send({ embeds: [embed] });
        }

        interaction.reply({ content: `✅ ${target.tag} has been unmuted.`, ephemeral: false });
    }
};
