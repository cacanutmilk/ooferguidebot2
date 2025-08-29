module.exports = {
  name: 'fluffy',
  chance: 0.1, 
  userId: '960799035063664660',

  async execute(message, args) {
    if (message.author.id === this.userId) {
      return message.channel.send(`chat hes fluffy`);
    }


    if (Math.random() <= this.chance) {
      return message.channel.send(`fluffy waz here`);
    }
  },
};
