const { use_mcp_tool } = require('@modelcontextprotocol/sdk/client');

class AutoGenService {
  constructor() {
    this.agents = new Map();
  }

  async createAgent(config) {
    const { name, role, systemMessage } = config;

    const agent = {
      name,
      role,
      systemMessage,
      async sendMessage(messages) {
        const response = await use_mcp_tool('claude', 'chat', {
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          context: {
            systemMessage: this.systemMessage,
            temperature: 0.7,
            maxTokens: 2000
          }
        });
        return response.content;
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
