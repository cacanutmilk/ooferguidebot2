const { SlashCommandBuilder, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('category')
        .setDescription('Manage categories')
        .addSubcommand(sub =>
            sub.setName('create')
                .setDescription('Create a category')
                .addStringOption(opt => opt.setName('name').setDescription('Category name').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('delete')
                .setDescription('Delete a category')
                .addStringOption(opt => opt.setName('id').setDescription('Category ID').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('edit')
                .setDescription('Rename a category')
                .addStringOption(opt => opt.setName('id').setDescription('Category ID').setRequired(true))
                .addStringOption(opt => opt.setName('new_name').setDescription('New name').setRequired(true))
        ),

    async execute(interaction) {
        const allowedRoles = ['Management Fish', 'Community Holder', 'Goldfish'];
        if (!interaction.member.roles.cache.some(r => allowedRoles.includes(r.name))) {
            return interaction.reply({ content: '❌ You don’t have permission for this command.', ephemeral: true });
        }

        const sub = interaction.options.getSubcommand();

        try {
            await interaction.deferReply({ ephemeral: true });

            // --- CREATE CATEGORY ---
            if (sub === 'create') {
                const name = interaction.options.getString('name');
                const category = await interaction.guild.channels.create({
                    name,
                    type: ChannelType.GuildCategory
                });
                return interaction.editReply({ content: `✅ Created category: **${category.name}** (ID: ${category.id})` });
            }

            // --- DELETE CATEGORY ---
            if (sub === 'delete') {
                const id = interaction.options.getString('id');
                const category = interaction.guild.channels.cache.get(id);

                if (!category || category.type !== ChannelType.GuildCategory) {
                    return interaction.editReply({ content: '❌ Category not found or invalid ID.' });
                }

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`delcat_confirm_${category.id}`).setLabel('Confirm').setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId('delcat_cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
                );

                await interaction.editReply({ content: `⚠️ Delete category **${category.name}**? This will not delete its channels.`, components: [row] });

                const filter = i => i.user.id === interaction.user.id && i.customId.startsWith('delcat_');
                const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

                collector.on('collect', async i => {
                    try {
                        if (i.customId === `delcat_confirm_${category.id}`) {
                            await category.delete();
                            await i.update({ content: `✅ Category **${category.name}** deleted.`, components: [] });
                        } else if (i.customId === 'delcat_cancel') {
                            await i.update({ content: '❌ Deletion cancelled.', components: [] });
                        }
                    } catch (err) {
                        console.error('❌ Error handling category deletion:', err);
                        await i.update({ content: '⚠️ Something went wrong.', components: [] }).catch(() => {});
                    }
                    collector.stop();
                });

                collector.on('end', collected => {
                    if (collected.size === 0) {
                        interaction.editReply({ content: '❌ Deletion timed out.', components: [] }).catch(() => {});
                    }
                });
            }

            // --- EDIT CATEGORY ---
            if (sub === 'edit') {
                const id = interaction.options.getString('id');
                const newName = interaction.options.getString('new_name');
                const category = interaction.guild.channels.cache.get(id);

                if (!category || category.type !== ChannelType.GuildCategory) {
                    return interaction.editReply({ content: '❌ Category not found or invalid ID.' });
                }

                await category.setName(newName);
                return interaction.editReply({ content: `✅ Renamed category to **${newName}**` });
            }

        } catch (err) {
            console.error('❌ Error executing category command:', err);
            if (interaction.replied || interaction.deferred) {
                return interaction.followUp({ content: '⚠️ Something went wrong.', ephemeral: true }).catch(() => {});
            } else {
                return interaction.reply({ content: '⚠️ Something went wrong.', ephemeral: true }).catch(() => {});
            }
        }
    }
};
