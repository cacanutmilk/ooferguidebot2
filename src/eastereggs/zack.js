module.exports = {
  name: 'zack',
  chance: 0.2, 
  userId: '761949400557682719',

  async execute(message, args) {
    if (message.author.id === this.userId) {
      return message.channel.send(`YOU DARE PINGING ME? HOLD MY [+ULTRARICOSHOT] AND [+PARRY]!! `);
    }


    if (Math.random() <= this.chance) {
      return message.channel.send(`hey you are zachipoo certified!`);
    }
  },
};
