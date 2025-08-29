const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Give a member a warning.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The Member to warn?')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for warning?')
                .setRequired(true)),

    async execute(interaction) {
        const staffRole = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === "staff");
        if (!interaction.member.roles.cache.has(staffRole?.id)) {
            return interaction.reply({ content: "❌ You don't have permission to use this command.", ephemeral: true });
        }

        const target = interaction.options.getUser('target');
        const member = await interaction.guild.members.fetch(target.id).catch(() => null);
        const reason = interaction.options.getString('reason');
        const moderator = interaction.user;

        // ✅ Force UTC with AM/PM, English only
        const time = new Date().toLocaleString("en-US", {
            timeZone: "UTC",
            hour12: true,
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });

        const logChannel = interaction.guild.channels.cache.find(ch => ch.name === '🏴│moderation-logs');

        if (!member) return interaction.reply({ content: '❌ Member not found.', ephemeral: true });
        if (member.roles.cache.has(staffRole?.id)) {
            return interaction.reply({ content: "⚠️ You cannot warn another staff member.", ephemeral: true });
        }

        // Load warnings
        let warnings = {};
        if (fs.existsSync('warnings.json')) {
            warnings = JSON.parse(fs.readFileSync('warnings.json', 'utf8'));
        }

        if (!warnings[target.id]) warnings[target.id] = [];
        warnings[target.id].push({ reason, moderator: moderator.tag, time });

        fs.writeFileSync('warnings.json', JSON.stringify(warnings, null, 2));

        // Increment case
        let cases = { count: 0 };
        if (fs.existsSync('cases.json')) {
            cases = JSON.parse(fs.readFileSync('cases.json', 'utf8'));
        }
        cases.count = (cases.count || 0) + 1;
        fs.writeFileSync('cases.json', JSON.stringify(cases, null, 2));

        // Log to channel
        if (logChannel) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000') // 🔴 Red
                .setTitle('⚠️ Warning Issued')
                .addFields(
                    { name: 'Case', value: `${cases.count}`, inline: true },
                    { name: 'User', value: `${target.tag}`, inline: true },
                    { name: 'Moderator', value: `${moderator.tag}`, inline: true },
                    { name: 'Time (UTC)', value: time, inline: true },
                    { name: 'Reason', value: reason }
                )
                .setTimestamp()
                .setFooter({ text: 'Moderation Log', iconURL: interaction.guild.iconURL() });

            logChannel.send({ embeds: [embed] });
        }

        // Send DM to the warned user
        try {
            await target.send(
                `⚠️ You have been warned in **${interaction.guild.name}**.\n` +
                `**Reason:** ${reason}\n` +
                `**Moderator:** ${moderator.tag}\n` +
                `**Time (UTC):** ${time}\n` +
                `This is case number ${cases.count}. Please follow the server rules.`
            );
        } catch (err) {
            console.log(`Could not send DM to ${target.tag}.`);
        }

        return interaction.reply({ content: `✅ ${target.tag} has been warned.`, ephemeral: false });
    }
};
