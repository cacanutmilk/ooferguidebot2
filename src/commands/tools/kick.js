const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a member from the server.')
        .addUserOption(option => option.setName('target').setDescription('Member to kick').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Reason for kick').setRequired(true)),

    async execute(interaction) {
        const staffRole = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === "staff");
        if (!staffRole || !interaction.member.roles.cache.has(staffRole.id))
            return interaction.reply({ content: "❌ You need Staff role to kick members.", ephemeral: true });

        const targetUser = interaction.options.getUser('target');
        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        if (!member) return interaction.reply({ content: "❌ User not found.", ephemeral: true });

        const reason = interaction.options.getString('reason');

        try {
            await member.kick(reason);

            // Update case
            const casesPath = path.join(process.cwd(), 'cases.json');
            let cases = { lastCase: 0, count: 0 };
            if (fs.existsSync(casesPath)) cases = JSON.parse(fs.readFileSync(casesPath, 'utf8'));
            cases.count++;
            fs.writeFileSync(casesPath, JSON.stringify(cases, null, 2));
            const caseNumber = cases.count;

            // Log embed
            const logChannel = interaction.guild.channels.cache.find(ch => ch.name === '🏴│moderation-logs');
            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('Kick Issued')
                    .addFields(
                        { name: 'Case', value: `${caseNumber}`, inline: true },
                        { name: 'User', value: `${targetUser.tag} (\`${targetUser.id}\`)`, inline: true },
                        { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
                        { name: 'Reason', value: reason, inline: false },
                        { name: 'Date (UTC)', value: new Date().toUTCString(), inline: false }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Moderation Log', iconURL: interaction.guild.iconURL() });

                await logChannel.send({ embeds: [embed] });
            }

            await interaction.reply({ content: `✅ ${targetUser.tag} has been kicked. (Case #${caseNumber})`, ephemeral: false });
        } catch (err) {
            console.error(err);
            interaction.reply({ content: '❌ Failed to kick member.', ephemeral: true });
        }
    }
};
