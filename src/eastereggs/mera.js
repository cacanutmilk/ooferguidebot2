module.exports = {
  name: 'mera',
  chance: 0.2, 
  userId: '1307317668965126245',

  async execute(message, args) {
    if (message.author.id === this.userId) {
      return message.channel.send(`"NOOOO NOW LET ME LEAVEEE" - mera`);
    }


    if (Math.random() <= this.chance) {
      return message.channel.send(`"you too, stop teaming with kaayo in forsaken :< " - coco`);
    }
  },
};
