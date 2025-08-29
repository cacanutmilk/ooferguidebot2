const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roleadd')
        .setDescription('Add a role to the server')
        .addStringOption(opt => opt.setName('name').setDescription('Role Name').setRequired(true))
        .addStringOption(opt => opt.setName('color').setDescription('Role Color (#hex)'))
        .addBooleanOption(opt => opt.setName('hoist').setDescription('Display role separately')),

    async execute(interaction) {
        const member = interaction.member;
        const allowedRoles = ['Management Fish', 'Community Holder', 'Goldfish'];

        if (!allowedRoles.some(r => member.roles.cache.some(role => role.name === r))) {
            return interaction.reply({ content: 'You do not have permission to add roles.', ephemeral: true });
        }

        const name = interaction.options.getString('name');
        const color = interaction.options.getString('color') || 'Default';
        const hoist = interaction.options.getBoolean('hoist') || false;

        try {
            const role = await interaction.guild.roles.create({ name, color, hoist });

            await interaction.reply(`Role ${role.name} created successfully!`); // Use await

            // Log
            const logChannel = interaction.guild.channels.cache.find(c => c.name === '🏴│moderation-logs');
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('Role Created')
                    .addFields(
                        { name: 'Role', value: role.name },
                        { name: 'By', value: interaction.user.tag }
                    )
                    .setColor('Green')
                    .setTimestamp();

                await logChannel.send({ embeds: [logEmbed] });
            }
        } catch (err) {
            await interaction.reply({ content: `Error: ${err.message}`, ephemeral: true });
        }
    }
};
