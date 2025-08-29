const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roleinfo')
        .setDescription('Get information about a role.')
        .addStringOption(opt => opt.setName('rolename').setDescription('Role name').setRequired(true)),

    async execute(interaction) {
        const fishRole = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === 'fish');
        if (!fishRole || !interaction.member.roles.cache.has(fishRole.id))
            return interaction.reply({ content: "❌ Fish role required.", ephemeral: true });

        const roleName = interaction.options.getString('rolename');
        const role = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
        if (!role) return interaction.reply({ content: '❌ Role not found.', ephemeral: true });

        const permissions = Object.keys(PermissionsBitField.Flags)
            .filter(p => role.permissions.has(PermissionsBitField.Flags[p]))
            .join(', ') || 'None';

        const embed = new EmbedBuilder()
            .setTitle(`🔹 Role Info: ${role.name}`)
            .setColor(role.color || '#00FFFF')
            .addFields(
                { name: 'Role ID', value: role.id, inline: true },
                { name: 'Color', value: `#${role.color.toString(16).padStart(6,'0')}`, inline: true },
                { name: 'Permissions', value: permissions, inline: false }
            );

        interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
