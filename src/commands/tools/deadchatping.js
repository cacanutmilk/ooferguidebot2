const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const cooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deadchatping')
        .setDescription('Ping Dead Chat ping! (Limit: 4 uses)')
        .addStringOption(opt => opt.setName('message').setDescription('Message to send').setRequired(true)),

    async execute(interaction) {
        const staffRoles = ['Mod Fish', 'Admin Fish', 'Management Fish', 'Community Holder', 'Goldfish'];
        const bypassUserId = '941309399341887529';
        const deadChatRoleId = '1236085384434421811';
        const logChannelName = '🏴│moderation-logs';

        const member = interaction.member;
        const userId = interaction.user.id;

        // Only staff can use
        if (!member.roles.cache.some(r => staffRoles.includes(r.name))) {
            return interaction.reply({ content: '❌ Only staff can use this command.', ephemeral: true });
        }

        const bypass = member.roles.cache.some(r => ['Community Holder', 'Management Fish', 'Goldfish'].includes(r.name)) || userId === bypassUserId;

        const now = Date.now();
        let data = cooldowns.get(interaction.guild.id) || { pings: 0, last: 0, userUsed: {}, dailyCount: 0, dailyDate: 0 };

        // Reset daily usage and daily counter
        if (!bypass && (!data.dailyDate || now - data.dailyDate > 24 * 60 * 60 * 1000)) {
            data = { pings: 0, last: 0, userUsed: {}, dailyCount: 0, dailyDate: now };
        }

        // Check cooldown limits
        if (!bypass) {
            if (data.pings >= 4) return interaction.reply({ content: '❌ Max 4 Dead Chat pings per day reached.', ephemeral: true });
            if (data.userUsed[userId] && now - data.userUsed[userId] < 24 * 60 * 60 * 1000) return interaction.reply({ content: '❌ You can only use this once per day.', ephemeral: true });
            if (data.last && now - data.last < 90 * 60 * 1000) return interaction.reply({ content: '❌ Must wait 1h30m since last ping.', ephemeral: true });
        }

        const msg = interaction.options.getString('message');

        try {
            // Send Dead Chat ping
            await interaction.channel.send(`<@&${deadChatRoleId}> ${msg}`);

            // Update cooldowns
            if (!bypass) {
                data.pings++;
                data.last = now;
                data.userUsed[userId] = now;
            }

            // Update daily count
            data.dailyCount = (data.dailyCount || 0) + 1;
            data.dailyDate = now;
            cooldowns.set(interaction.guild.id, data);

            // Log to moderation-logs channel with embed
            const logChannel = interaction.guild.channels.cache.find(ch => ch.name === logChannelName && ch.type === 0);
            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setTitle('📝 Dead Chat Ping')
                    .setColor('#FF0000')
                    .addFields(
                        { name: 'User', value: `${interaction.user.tag}`, inline: true },
                        { name: 'User ID', value: `${interaction.user.id}`, inline: true },
                        { name: 'Channel', value: `${interaction.channel}`, inline: true },
                        { name: 'Message', value: msg },
                        { name: 'Daily Pings Count', value: `${data.dailyCount}`, inline: true }
                    )
                    .setTimestamp();

                await logChannel.send({ embeds: [embed] });
            }

            return interaction.reply({ content: '✅ Dead Chat ping sent!', ephemeral: true });
        } catch (err) {
            console.error('❌ Error sending Dead Chat ping:', err);
            return interaction.reply({ content: '⚠️ Something went wrong while sending the ping.', ephemeral: true });
        }
    }
};
