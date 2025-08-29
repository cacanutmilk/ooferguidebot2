const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unlockchannel')
        .setDescription('Unlock a previously locked channel.')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to unlock')
                .setRequired(true)),

    async execute(interaction) {
        const allowedRoles = ["Management Fish", "Community Holder", "Goldfish"];
        const hasRole = interaction.member.roles.cache.some(r => allowedRoles.includes(r.name));
        if (!hasRole) return interaction.reply({ content: "❌ You don't have permission.", ephemeral: true });

        const channel = interaction.options.getChannel('channel');
        if (!channel.isTextBased()) return interaction.reply({ content: "⚠️ Please select a text channel.", ephemeral: true });

        try {
            const perms = channel.permissionsFor(interaction.guild.roles.everyone);
            if (perms.has('SendMessages')) return interaction.reply({ content: "⚠️ Channel is already unlocked.", ephemeral: true });

            await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: true });

            // Increment case number
            const casesPath = path.join(process.cwd(), 'cases.json');
            let cases = { lastCase: 0, count: 0 };
            if (fs.existsSync(casesPath)) cases = JSON.parse(fs.readFileSync(casesPath, 'utf8'));
            cases.count++;
            fs.writeFileSync(casesPath, JSON.stringify(cases, null, 2));

            const logChannel = interaction.guild.channels.cache.find(ch => ch.name === '🏴│moderation-logs');
            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('🔓 Channel Unlocked')
                    .addFields(
                        { name: 'Case', value: `${cases.count}`, inline: true },
                        { name: 'Channel', value: `${channel}`, inline: true },
                        { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
                        { name: 'Time (UTC)', value: new Date().toUTCString(), inline: true }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Moderation Log', iconURL: interaction.guild.iconURL() });

                await logChannel.send({ embeds: [embed] });
            }

            await interaction.reply({ content: `✅ ${channel} has been unlocked.`, ephemeral: false });
        } catch (err) {
            console.error(err);
            interaction.reply({ content: "❌ Failed to unlock channel.", ephemeral: true });
        }
    }
};
