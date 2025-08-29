const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const ms = require('ms');

const casesPath = path.join(__dirname, '../../../cases.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user with time and reason')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('time')
                .setDescription('Ban duration (e.g. 10m, 1h, 1d, perm)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the ban')
                .setRequired(true)),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('target');
        const time = interaction.options.getString('time');
        const reason = interaction.options.getString('reason');
        const moderator = interaction.user;

        // Staff check
        const staffRole = interaction.guild.roles.cache.find(r => r.name?.toLowerCase() === 'staff');
        if (!staffRole) return interaction.reply({ content: '❌ Staff role not found.', ephemeral: true });
        if (!interaction.member.roles.cache.has(staffRole.id)) return interaction.reply({ content: "❌ You don't have permission.", ephemeral: true });

        // Fetch member
        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        if (!member) return interaction.reply({ content: '❌ User not found.', ephemeral: true });

        // Prevent banning staff/self/higher roles
        if (member.roles.cache.has(staffRole.id)) return interaction.reply({ content: '⚠️ Cannot ban another staff member.', ephemeral: true });
        if (interaction.member.roles.highest.position <= member.roles.highest.position) return interaction.reply({ content: '⚠️ Cannot ban someone with equal/higher role.', ephemeral: true });
        if (targetUser.id === moderator.id) return interaction.reply({ content: '❌ You cannot ban yourself.', ephemeral: true });

        // Convert time
        let duration = null;
        if (time.toLowerCase() !== 'perm') {
            duration = ms(time);
            if (!duration) return interaction.reply({ content: '❌ Invalid time format. Use 10m, 1h, 1d, etc.', ephemeral: true });
        }

        // Increment case number
        let caseNumber = 1;
        if (fs.existsSync(casesPath)) {
            try {
                const data = fs.readFileSync(casesPath, 'utf8');
                const json = JSON.parse(data);
                caseNumber = (json.lastCase || 0) + 1;
            } catch (err) {
                console.error('Error reading cases.json:', err);
            }
        }

        // Save new case number
        try {
            fs.writeFileSync(casesPath, JSON.stringify({ lastCase: caseNumber }, null, 2), 'utf8');
        } catch (err) {
            console.error('Error writing to cases.json:', err);
        }

        // DM the user
        let dmFailed = false;
        try {
            await targetUser.send(`🚫 You have been banned from **${interaction.guild.name}**.\n**Reason:** ${reason}\n**Duration:** ${duration ? time : 'Permanent'}`);
        } catch {
            dmFailed = true;
        }

        // Ban user
        try {
            await interaction.guild.members.ban(targetUser.id, { reason });
        } catch {
            return interaction.reply({ content: '❌ Failed to ban (permissions).', ephemeral: true });
        }

        // Embed log
        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('🔨 Ban Issued')
            .addFields(
                { name: 'Case', value: `${caseNumber}`, inline: true },
                { name: 'User', value: `${targetUser.tag} (\`${targetUser.id}\`)`, inline: true },
                { name: 'Moderator', value: `${moderator.tag}`, inline: true },
                { name: 'Time', value: duration ? time : 'Permanent', inline: true },
                { name: 'Reason', value: reason },
                { name: 'DM Sent', value: dmFailed ? '❌ Failed to DM' : '✅ DM Sent', inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'Moderation Log', iconURL: interaction.guild.iconURL?.() || null });

        const logChannel = interaction.guild.channels.cache.find(ch => ch.name === '🏴│moderation-logs');
        if (logChannel) await logChannel.send({ embeds: [embed] }).catch(() => {});

        await interaction.reply({ content: `✅ ${targetUser.tag} has been banned. (Case #${caseNumber})`, ephemeral: false });

        // Automatic unban if temporary
        if (duration) {
            setTimeout(async () => {
                try {
                    await interaction.guild.members.unban(targetUser.id);

                    // Log automatic unban
                    if (logChannel) {
                        const unbanEmbed = new EmbedBuilder()
                            .setColor('#00FF00')
                            .setTitle('🔓 Temporary Ban Expired')
                            .addFields(
                                { name: 'Case', value: `${caseNumber}`, inline: true },
                                { name: 'User', value: `${targetUser.tag} (\`${targetUser.id}\`)`, inline: true },
                                { name: 'Moderator', value: `${moderator.tag}`, inline: true },
                                { name: 'Duration', value: time, inline: true },
                                { name: 'Reason', value: reason }
                            )
                            .setTimestamp()
                            .setFooter({ text: 'Moderation Log', iconURL: interaction.guild.iconURL?.() || null });
                        await logChannel.send({ embeds: [unbanEmbed] }).catch(() => {});
                    }
                } catch (err) {
                    console.error(`❌ Failed to unban ${targetUser.tag}:`, err);
                }
            }, duration);
        }
    }
};
