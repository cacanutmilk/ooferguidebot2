module.exports = {
  name: 'tf2',
  chance: 0.3, 
  userId: '1329101212498268294',

  async execute(message, args) {
    if (message.author.id === this.userId) {
      return message.channel.send(`THE RED SPY IS IN THE BASE AHHHHHHHHHHHHHHHHHHHHHHHH`);
    }


    if (Math.random() <= this.chance) {
      return message.channel.send(`THE RED SPY IS IN THE BASE AHHHHHHHHHHHHHHHHH`);
    }
  },
};
