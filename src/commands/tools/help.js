const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const fishCommands = [
  { name: 'ping', desc: 'Bot testing command' },
  { name: 'roleinfo', desc: 'Check role permissions' },
  { name: 'serverinfo', desc: 'Shows server info' },
  { name: 'version', desc: 'Check bot version' },
  { name: 'help', desc: 'Shows commands available to you' },
  { name: 'getavatar', desc: 'Get user avatar. Format: `/getavatar @username`' },
  { name: 'getavatarguild', desc: 'Get server avatar. Format: `/getavatarguild`' },
  { name: 'getavataruser', desc: 'Get your avatar. Format: `/getavataruser`' },
];

const moderationCommands = {
  Notes: [
    { name: 'noteadd', desc: 'Add a note. Format: `/noteadd @username note`' },
    { name: 'notes', desc: 'View notes. Format: `/notes @username`' },
    { name: 'delnote', desc: 'Remove a note. Format: `/delnote @username Note_Id`' },
    { name: 'editnote', desc: 'Edit a note message. Format: `/editnote @username Note_Id New_Message`' },
  ],
  Warnings: [
    { name: 'warn', desc: 'Warn a member. Format: `/warn @username Reason`' },
    { name: 'warnings', desc: 'View warnings. Format: `/warnings @username`' },
    { name: 'delwarn', desc: 'Remove a warning. Format: `/delwarn @username Warn_Id`' },
    { name: 'clearwarns', desc: 'Remove all warnings. Format: `/clearwarns @username`' },
    { name: 'editwarn', desc: 'Edit a warning message. Format: `/editwarn @username Warn_Id New_Message`' },
  ],
  'Ban & Kick': [
    { name: 'ban', desc: 'Ban a member. Format: `/ban @username Time Reason`' },
    { name: 'unban', desc: 'Unban a user. Format: `/unban User_Id Reason`' },
    { name: 'kick', desc: 'Kick a member. Format: `/kick @username Reason`' },
    { name: 'getbannedusers', desc: 'Get list of banned users. Format: `/getbannedusers`' },
  ],
  Mute: [
    { name: 'mute', desc: 'Mute a member. Format: `/mute @username Time Reason`' },
    { name: 'unmute', desc: 'Unmute a member. Format: `/unmute @username reason (optional)`' },
  ],
  Other: [
    { name: 'say', desc: 'Make bot say something. Format: `/say message (#channel, Optional)`' },
    { name: 'delmsg', desc: 'Delete messages. Format: `/delmsg amount (limit 100)`' },
    { name: 'delmsguser', desc: 'Delete a specific amount of messages sent by a user. Format: `/delmsguser @username amount`' },
    { name: 'modlog', desc: 'Show moderation logs. Format: `/modlog @username`' },
    { name: 'nick', desc: 'Change a member\'s nickname. Format: `/nick @username NewNickname`' },
  ],
  Giveaways: [
    { name: 'giveawayCreate', desc: 'Create a giveaway. Format: `/giveawayCreate #channel winners duration prize`' },
    { name: 'giveawayEnd', desc: 'End a giveaway. Format: `/giveawayEnd message_id/message_link`' },
    { name: 'giveawayReroll', desc: 'Reroll giveaway winners. Format: `/giveawayReroll message_id/message_link`' },
  ],
  Polls: [
    { name: 'pollcreate', desc: 'Create a poll. Format: `/pollcreate question option1 option2 duration multiple`' },
    { name: 'pollshow', desc: 'Show poll results. Format: `/pollshow message_id/message_link`' },
  ],
  'Management Only': [
    { name: 'resetcase', desc: 'Reset moderation case number. Format: `/resetcase`' },
    { name: 'lockchannel', desc: 'Lock a channel. Format: `/lockchannel #channel`' },
    { name: 'unlockchannel', desc: 'Unlock a channel. Format: `/unlockchannel #channel`' },
    { name: 'givemod', desc: 'Give a role moderator permissions. Format: `/givemod @role`' },
    { name: 'delmod', desc: 'Remove moderator permissions from a role. Format: `/delmod @role`' },
    { name: 'giverole', desc: 'Give a role to a user. Format: `/giverole @username Role`' },
    { name: 'takerole', desc: 'Remove a role from a user. Format: `/takerole @username Role`' },
    { name: 'roleadd', desc: 'Add a role to the server. Format: `/roleadd name (color hoist, optional)`' },
    { name: 'delrole', desc: 'Delete a role. Format: `/delrole @role`' },
    { name: 'resetgiveaway', desc: 'Reset giveaway counter. Format: `/resetgiveaway`' },
  ],
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Shows commands available to you'),

  async execute(interaction) {
    const member = interaction.member;
    const roles = member.roles.cache;

    const hasFish = roles.some(r => r.name === 'Fish');
    const hasStaff = roles.some(r => r.name === 'Staff');
    const hasManagement = roles.some(r => ['Management Fish', 'Community Holder', 'Goldfish'].includes(r.name));

    let description = '';

    if (hasManagement) {
      // Fish + all moderation commands
      description += '**Commands:**\n';
      fishCommands.forEach(cmd => {
        description += `• **\`${cmd.name}\`** — ${cmd.desc}\n`;
      });

      description += '\n**Moderation Commands:**';
      for (const [category, cmds] of Object.entries(moderationCommands)) {
        description += `\n\n**${category}**\n`;
        cmds.forEach(cmd => {
          description += `• **\`${cmd.name}\`** — ${cmd.desc}\n`;
        });
      }

    } else if (hasStaff && hasFish) {
      // Fish + moderation commands (excluding Management Only)
      description += '**Commands:**\n';
      fishCommands.forEach(cmd => {
        description += `• **\`${cmd.name}\`** — ${cmd.desc}\n`;
      });

      description += '\n**Moderation Commands:**';
      for (const [category, cmds] of Object.entries(moderationCommands)) {
        if (category === 'Management Only') continue;
        description += `\n\n**${category}**\n`;
        cmds.forEach(cmd => {
          description += `• **\`${cmd.name}\`** — ${cmd.desc}\n`;
        });
      }

    } else if (hasFish) {
      // Only Fish Commands
      description += '**Commands:**\n';
      fishCommands.forEach(cmd => {
        description += `• **\`${cmd.name}\`** — ${cmd.desc}\n`;
      });

    } else {
      description = 'You do not have access to any commands.';
    }

    const embed = new EmbedBuilder()
      .setTitle('Help - Commands')
      .setDescription(description)
      .setColor('Blue');

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
