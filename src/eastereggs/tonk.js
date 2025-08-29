module.exports = {
  name: 'tonk',
  chance: 0.1, 
  userId: '667179181565542404',

  async execute(message, args) {
    if (message.author.id === this.userId) {
      return message.channel.send(`hi guyz im teh uhhhh. tonk!!`);
    }


    if (Math.random() <= this.chance) {
      return message.channel.send(`yo wait is that the epic former manager fish?!?!?!`);
    }
  },
};
