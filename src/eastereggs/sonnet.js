module.exports = {
  name: 'sonnet',
  chance: 0.2, 
  userId: '807067382010871808',

  async execute(message, args) {
    if (message.author.id === this.userId) {
      return message.channel.send(`:3`);
    }


    if (Math.random() <= this.chance) {
      return message.channel.send(`"bro stop teaming in forsaken with lamith" - coco`);
    }
  },
};
