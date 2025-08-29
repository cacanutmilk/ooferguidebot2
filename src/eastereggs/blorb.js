module.exports = {
  name: 'blorb',
  chance: 0.1, 
  userId: '1292262373956128792',

  async execute(message, args) {
    if (message.author.id === this.userId) {
      return message.channel.send(`we are not humans, we are orbs, and orbs are..`);
    }


    if (Math.random() <= this.chance) {
      return message.channel.send(`we are not humans, we are orbs, and orbs are..`);
    }
  },
};
