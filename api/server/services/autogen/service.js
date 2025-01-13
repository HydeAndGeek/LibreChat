const OpenAI = require('openai');

class AutoGenService {
  constructor() {
    this.agents = new Map();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async createAgent(config) {
    const { name, role, systemMessage } = config;

    const agent = {
      name,
      role,
      systemMessage,
      openai: this.openai,
      async sendMessage(messages) {
        try {
          const response = await this.openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: this.systemMessage },
              ...messages.map(msg => ({
                role: msg.role,
                content: msg.content
              }))
            ],
            temperature: 0.7,
            max_tokens: 2000
          });
          return response.choices[0].message.content;
        } catch (error) {
          console.error('AutoGen message error:', error);
          throw new Error('Failed to process message: ' + error.message);
        }
      }
    };

    this.agents.set(name, agent);
    return agent;
  }

  async createTeam(config) {
    const { agents, tasks } = config;

    const team = {
      agents: await Promise.all(agents.map(agent => this.createAgent(agent))),
      tasks,
      async run() {
        const results = [];
        for (const task of this.tasks) {
          const taskResult = await this.executeTask(task);
          results.push(taskResult);
        }
        return results;
      },
      async executeTask(task) {
        const { initiator, steps } = task;
        const agent = this.agents.find(a => a.name === initiator);

        let messages = [];
        let currentStep = 0;

        while (currentStep < steps.length) {
          const step = steps[currentStep];
          const response = await agent.sendMessage([
            ...messages,
            { role: 'user', content: step.prompt }
          ]);

          messages.push(
            { role: 'user', content: step.prompt },
            { role: 'assistant', content: response }
          );

          currentStep++;
        }

        return messages;
      }
    };

    return team;
  }
}

module.exports = new AutoGenService();
