module.exports = {
  name: 'icey',
  chance: 0.3, 
  userId: '812093403222638602',

  async execute(message, args) {
    if (message.author.id === this.userId) {
      return message.channel.send(`yo icey welcom back and uhhhh, pwease gib mi 1 ice tea`);
    }


    if (Math.random() <= this.chance) {
      return message.channel.send(`icey was here, heres some free icey tea!!`);
    }
  },
};
