module.exports = {
  name: 'damian',
  chance: 0.01, 
  userId: '394028372725989379',

  async execute(message, args) {
    if (message.author.id === this.userId) {
      return message.channel.send(`OH MY GOD IS THAT PMDAMIANN FROM YOUTUBE!??! SAJDKSANJDLSADSAAMDSAFMADSLASKMD`);
    }


    if (Math.random() <= this.chance) {
      return message.channel.send(`yo wait its the chicken guy!! (not shedletsky) `);
    }
  },
};
