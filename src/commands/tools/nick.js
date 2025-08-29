const { SlashCommandBuilder } = require('discord.js');

module.exports = {

    data: new SlashCommandBuilder()
        .setName('nick')
        .setDescription("Change a member's nickname")
        .addUserOption(option => 
            option.setName('target')
                .setDescription('The member whose nickname you want to change')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('nickname')
                .setDescription('The new nickname (leave blank to reset it)')
                .setRequired(false)), 


    async execute(interaction) {
       
        const staffRole = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === 'staff');


        if (!staffRole || !interaction.member.roles.cache.has(staffRole.id)) {
            return interaction.reply({ content: "❌ Staff only. You don't have permission to use this command.", ephemeral: true });
        }

      
        const targetUser = interaction.options.getUser('target');

        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);


        if (!member) {
            return interaction.reply({ content: "❌ Member not found in this server.", ephemeral: true });
        }


        const newNickname = interaction.options.getString('nickname');

        try {
            // If the nickname is null or an empty string after trimming, reset it
            if (newNickname === null || newNickname.trim() === '') {
                await member.setNickname(null); // Set to null to remove nickname
                return interaction.reply({ content: `✅ Successfully **reset** nickname for **${targetUser.tag}**.`, ephemeral: true });
            } else {
                // Otherwise, set the new nickname
                await member.setNickname(newNickname);
                return interaction.reply({ content: `✅ Successfully changed nickname for **${targetUser.tag}** to **${newNickname}**.`, ephemeral: true });
            }
        } catch (error) {
            // Log any errors to the console
            console.error(error);

            // Specific error handling for missing permissions
            if (error.code === 50013) { // Discord API error code for Missing Permissions
                return interaction.reply({
                    content: "❌ I don't have permission to change that member's nickname. Please ensure my role is higher than the target member's role and I have 'Manage Nicknames' permission.",
                    ephemeral: true
                });
            }
            // Generic error message for other issues
            return interaction.reply({ content: "❌ An unexpected error occurred while trying to change the nickname. Please try again later.", ephemeral: true });
        }
    }
};