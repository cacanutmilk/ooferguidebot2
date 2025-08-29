module.exports = {
  name: 'caca',
  chance: 0.3, 
  userId: '941309399341887529',

  async execute(message, args) {
    if (message.author.id === this.userId) {
      return message.channel.send(`i caca 😭😭😭`);
    }


    if (Math.random() <= this.chance) {
      return message.channel.send(`i caca 😭😭😭`);
    }
  },
};
