const { AgentConfig } = require('./types');
const { logger } = require('../../../config');

class AutoGenService {
  constructor() {
    this.agents = new Map();
    this.conversations = new Map();
  }

  /**
   * Create a new agent instance
   * @param {AgentConfig} config Agent configuration
   * @returns {string} Agent ID
   */
  async createAgent(config) {
    try {
      const agentConfig = new AgentConfig(config);
      agentConfig.validate();

      const agentId = `${config.name}-${Date.now()}`;
      this.agents.set(agentId, {
        config: agentConfig,
        status: 'idle',
        conversation: []
      });

      logger.info(`Created agent: ${agentId}`);
      return agentId;
    } catch (error) {
      logger.error('Error creating agent:', error);
      throw error;
    }
  }

  /**
   * Send a message to an agent
   * @param {string} agentId Agent ID
   * @param {string} message Message content
   * @param {Object} context Additional context
   */
  async sendMessage(agentId, message, context = {}) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    try {
      // Add message to conversation
      agent.conversation.push({
        role: 'user',
        content: message,
        timestamp: Date.now(),
        context
      });

      // Process message based on agent capabilities
      const response = await this.processMessage(agent, message, context);

      // Add response to conversation
      agent.conversation.push({
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      });

      return response;
    } catch (error) {
      logger.error(`Error processing message for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Process a message using agent's capabilities
   * @private
   */
  async processMessage(agent, message, context) {
    const { config } = agent;

    // Initialize response context
    const responseContext = {
      capabilities: config.capabilities,
      history: agent.conversation,
      ...context
    };

    try {
      // Handle different capabilities
      if (config.capabilities.codeExecution) {
        responseContext.codeExecution = {
          enabled: true,
          sandbox: true
        };
      }

      if (config.capabilities.webAccess) {
        responseContext.webAccess = {
          enabled: true,
          allowedDomains: context.allowedDomains || []
        };
      }

      if (config.capabilities.fileIO) {
        responseContext.fileIO = {
          enabled: true,
          allowedPaths: context.allowedPaths || []
        };
      }

      // TODO: Implement actual LLM call using config.llmConfig
      // For now, return a placeholder response
      return `Agent ${config.name} processed: ${message}`;
    } catch (error) {
      logger.error('Error processing message:', error);
      throw error;
    }
  }

  /**
   * Create a group of agents for collaborative task execution
   * @param {AgentConfig[]} configs Array of agent configurations
   * @returns {Object} Group configuration with agent IDs
   */
  async createAgentGroup(configs) {
    try {
      const groupId = `group-${Date.now()}`;
      const agents = [];

      for (const config of configs) {
        const agentId = await this.createAgent(config);
        agents.push(agentId);
      }

      // Store group configuration
      this.conversations.set(groupId, {
        agents,
        status: 'idle',
        messages: []
      });

      return {
        groupId,
        agents
      };
    } catch (error) {
      logger.error('Error creating agent group:', error);
      throw error;
    }
  }

  /**
   * Execute a task using a group of agents
   * @param {string} groupId Group ID
   * @param {Object} task Task configuration
   */
  async executeGroupTask(groupId, task) {
    const group = this.conversations.get(groupId);
    if (!group) {
      throw new Error(`Group not found: ${groupId}`);
    }

    try {
      group.status = 'working';

      // Initialize task context
      const taskContext = {
        task,
        groupId,
        startTime: Date.now()
      };

      // Execute task with agent group
      for (const agentId of group.agents) {
        const agent = this.agents.get(agentId);
        if (!agent) continue;

        // Send task to each agent
        const response = await this.sendMessage(agentId, JSON.stringify(task), taskContext);

        // Store response in group conversation
        group.messages.push({
          agentId,
          response,
          timestamp: Date.now()
        });
      }

      group.status = 'completed';
      return group.messages;
    } catch (error) {
      group.status = 'error';
      logger.error(`Error executing group task for ${groupId}:`, error);
      throw error;
    }
  }

  /**
   * Get agent status and conversation history
   * @param {string} agentId Agent ID
   */
  getAgentStatus(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    return {
      config: agent.config,
      status: agent.status,
      conversation: agent.conversation
    };
  }

  /**
   * Get group status and conversation history
   * @param {string} groupId Group ID
   */
  getGroupStatus(groupId) {
    const group = this.conversations.get(groupId);
    if (!group) {
      throw new Error(`Group not found: ${groupId}`);
    }

    return {
      agents: group.agents,
      status: group.status,
      messages: group.messages
    };
  }
}

module.exports = {
  AutoGenService
};
