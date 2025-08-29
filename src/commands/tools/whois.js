const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('whois')
        .setDescription('Get info about a user.')
        .addUserOption(opt => opt.setName('target').setDescription('User to lookup').setRequired(true)),

    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const member = await interaction.guild.members.fetch(target.id).catch(() => null);

        let roles = 'N/A';
        if (member) {
            // Exclude @everyone role
            roles = member.roles.cache
                .filter(r => r.id !== interaction.guild.id)
                .map(r => `<@&${r.id}>`)
                .join(', ') || 'None';
        }

        let keyPerms = 'N/A';
        if (member) {
            const perms = new PermissionsBitField(member.permissions);
            const importantPerms = [
                'Administrator', 'ManageGuild', 'ManageRoles', 'KickMembers', 
                'BanMembers', 'ManageChannels', 'ManageMessages', 'ModerateMembers'
            ];
            keyPerms = importantPerms
                .filter(p => perms.has(PermissionsBitField.Flags[p]))
                .join(', ') || 'None';
        }

        const embed = new EmbedBuilder()
            .setTitle(`User Info: ${target.tag}`)
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'ID', value: target.id, inline: true },
                { name: 'Joined Discord', value: `<t:${Math.floor(target.createdTimestamp / 1000)}:R>`, inline: true },
                { name: 'Joined Server', value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'N/A', inline: true },
                { name: 'Roles', value: roles, inline: false },
                { name: 'Key Permissions', value: keyPerms, inline: false }
            )
            .setColor('Blue');

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
