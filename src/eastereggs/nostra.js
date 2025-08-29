module.exports = {
  name: 'nostra',
  chance: 0.2, 
  userId: '700341168927539230',

  async execute(message, args) {
    if (message.author.id === this.userId) {
      return message.channel.send(`"I hate working..."`);
    }


    if (Math.random() <= this.chance) {
      return message.channel.send(`Yay you are nostrypoo certified!`);
    }
  },
};
