module.exports = {
  name: 'blondie',
  chance: 0.3, 
  userId: '953769948566679552',

  async execute(message, args) {
    if (message.author.id === this.userId) {
      return message.channel.send(`yo its the blond guy!`);
    }


    if (Math.random() <= this.chance) {
      return message.channel.send(`yo its the blond guy!`);
    }
  },
};
