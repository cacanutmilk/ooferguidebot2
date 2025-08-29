const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const ms = require('ms'); // Make sure to install this

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mute a member for a specific time.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The member to mute')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('time')
                .setDescription('Mute duration (e.g., 10m, 2h)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for muting')
                .setRequired(true)),

    async execute(interaction) {
        const staffRole = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === 'staff');
        if (!interaction.member.roles.cache.has(staffRole?.id)) {
            return interaction.reply({ content: "❌ You don't have permission to use this command.", ephemeral: true });
        }

        const target = interaction.options.getUser('target');
        const member = await interaction.guild.members.fetch(target.id).catch(() => null);
        if (!member) return interaction.reply({ content: '❌ Member not found.', ephemeral: true });
        if (member.roles.cache.has(staffRole?.id)) return interaction.reply({ content: "⚠️ You cannot mute another staff member.", ephemeral: true });

        const timeString = interaction.options.getString('time');
        const reason = interaction.options.getString('reason');
        const moderator = interaction.user;
        const logChannel = interaction.guild.channels.cache.find(ch => ch.name === '🏴│moderation-logs');

        let duration;
        try {
            duration = ms(timeString);
            if (!duration || duration < 1000) throw new Error();
        } catch {
            return interaction.reply({ content: '❌ Invalid time format. Example: 10m, 2h', ephemeral: true });
        }

        // Apply the timeout
        await member.timeout(duration, `Muted by ${moderator.tag} | Reason: ${reason}`);

        // Handle case logging
        let cases = { count: 0 };
        if (fs.existsSync('cases.json')) {
            cases = JSON.parse(fs.readFileSync('cases.json', 'utf8'));
        }
        cases.count = (cases.count || 0) + 1;
        fs.writeFileSync('cases.json', JSON.stringify(cases, null, 2));


// ...

        if (logChannel) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000') // 🔴 Red
                .setTitle('🔇 Mute Issued')
                .addFields(
                    { name: 'Case', value: `${cases.count}`, inline: true },
                    { name: 'User', value: `${target.tag}`, inline: true },
                    { name: 'Moderator', value: `${moderator.tag}`, inline: true },
                    { name: 'Duration', value: timeString, inline: true },
                    { name: 'Reason', value: reason }
                )
                .setTimestamp()
                .setFooter({ text: 'Moderation Log', iconURL: interaction.guild.iconURL() });

            logChannel.send({ embeds: [embed] });
        }

        
        // DM the user
        try {
            await target.send(
                `🔇 You have been muted in **${interaction.guild.name}**.\n` +
                `**Duration:** ${timeString}\n` +
                `**Reason:** ${reason}\n` +
                `**Moderator:** ${moderator.tag}\n` +
                `Case number: ${cases.count}`
            );
        } catch (err) {
            console.log(`Could not DM ${target.tag}`);
        }

        interaction.reply({ content: `✅ ${target.tag} has been muted for ${timeString}.`, ephemeral: false });
    }
};
