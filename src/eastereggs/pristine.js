module.exports = {
  name: 'pristine',
  chance: 0.2, 
  userId: '548409344287571970',

  async execute(message, args) {
    if (message.author.id === this.userId) {
      return message.channel.send(`"my name is pristine, i make the beer, it is difficult, to put the beer in the cup."`);
    }


    if (Math.random() <= this.chance) {
      return message.channel.send(`no way.. is that grandma!?!?!?!`);
    }
  },
};
