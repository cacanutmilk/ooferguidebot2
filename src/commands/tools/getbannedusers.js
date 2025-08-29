const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getbannedusers')
        .setDescription('Displays all banned users (10 per page).'),

    async execute(interaction) {
        const staffRole = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === "staff");
        if (!staffRole || !interaction.member.roles.cache.has(staffRole.id)) {
            return interaction.reply({ content: "❌ You don't have permission to use this command.", flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const bans = await interaction.guild.bans.fetch();
        const bannedUsers = Array.from(bans.values());

        if (bannedUsers.length === 0) {
            return interaction.editReply({ content: "✅ No banned users found." });
        }

        let currentPage = 0;
        const perPage = 10;
        const totalPages = Math.ceil(bannedUsers.length / perPage);

        const generateEmbed = (page) => {
            const start = page * perPage;
            const end = start + perPage;
            const users = bannedUsers.slice(start, end);

            return new EmbedBuilder()
                .setTitle('🚫 Banned Users')
                .setDescription(users.map((ban, i) => `**${start + i + 1}.** ${ban.user.tag} — \`${ban.user.id}\``).join('\n'))
                .setFooter({ text: `Page ${page + 1} of ${totalPages}` })
                .setColor('#FF0000');
        };

        const getButtons = (page) => {
            return new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('prev')
                    .setLabel('⬅️ Previous')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page === 0),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('➡️ Next')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page >= totalPages - 1)
            );
        };

        const message = await interaction.editReply({
            embeds: [generateEmbed(currentPage)],
            components: [getButtons(currentPage)],
            fetchReply: true
        });

        const collector = message.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id,
            time: 60_000 // 1 minute
        });

        collector.on('collect', async i => {
            try {
                if (i.customId === 'prev') currentPage--;
                else if (i.customId === 'next') currentPage++;

                await i.update({
                    embeds: [generateEmbed(currentPage)],
                    components: [getButtons(currentPage)]
                });
            } catch (err) {
                console.error('Collector update failed:', err);
            }
        });

        collector.on('end', async () => {
            try {
                if (!message.deleted) {
                    await message.edit({ components: [] });
                }
            } catch (err) {
                if (err.code === 10008) {
                    console.warn('Message already deleted, cannot remove buttons.');
                } else {
                    console.error('Failed to remove buttons after collector ended:', err);
                }
            }
        });
    }
};
