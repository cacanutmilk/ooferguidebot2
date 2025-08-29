module.exports = {
  name: 'frostyz',
  chance: 0.1, 
  userId: '421295754448207873',

  async execute(message, args) {
    if (message.author.id === this.userId) {
      return message.channel.send(`...thank you for the contribution to this server, frostyz.`);
    }


    if (Math.random() <= this.chance) {
      return message.channel.send(`yo man do you want some beerz? 🍻`);
    }
  },
};
