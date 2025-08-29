module.exports = {
  name: 'soybean',
  chance: 0.1, 
  userId: '211598413328941066',

  async execute(message, args) {
    if (message.author.id === this.userId) {
      return message.channel.send(`wait is that soybeanie?? can i have some soy milk please..`);
    }


    if (Math.random() <= this.chance) {
      return message.channel.send(`hai!`);
    }
  },
};
