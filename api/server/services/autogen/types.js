/**
 * @typedef {Object} AgentConfig
 * @property {string} name - Name of the agent
 * @property {string} role - Role/purpose of the agent
 * @property {string} systemMessage - System message defining agent behavior
 * @property {Object} llmConfig - LLM configuration for the agent
 * @property {string} llmConfig.model - Model to use (e.g. 'gpt-4')
 * @property {number} llmConfig.temperature - Temperature setting
 * @property {number} llmConfig.maxTokens - Max tokens to generate
 * @property {Object} capabilities - Agent capabilities configuration
 * @property {boolean} capabilities.codeExecution - Whether agent can execute code
 * @property {boolean} capabilities.webAccess - Whether agent can access web
 * @property {boolean} capabilities.fileIO - Whether agent can read/write files
 * @property {string[]} capabilities.allowedTools - List of allowed tool names
 */

/**
 * @typedef {Object} AgentMessage
 * @property {string} role - Message role (system, user, assistant)
 * @property {string} content - Message content
 */

/**
 * @typedef {Object} AgentConversation
 * @property {string} id - Conversation ID
 * @property {AgentMessage[]} messages - Conversation messages
 * @property {Object} metadata - Additional conversation metadata
 */

/**
 * @typedef {Object} AgentAction
 * @property {string} type - Action type (e.g. 'code_execution', 'web_request')
 * @property {Object} params - Action parameters
 * @property {string} status - Action status
 * @property {Object} result - Action result
 */

class AgentConfig {
  constructor(config) {
    this.name = config.name;
    this.role = config.role;
    this.systemMessage = config.systemMessage;
    this.llmConfig = {
      model: config.llmConfig?.model || 'gpt-4',
      temperature: config.llmConfig?.temperature || 0.7,
      maxTokens: config.llmConfig?.maxTokens || 2000
    };
    this.capabilities = {
      codeExecution: config.capabilities?.codeExecution || false,
      webAccess: config.capabilities?.webAccess || false,
      fileIO: config.capabilities?.fileIO || false,
      allowedTools: config.capabilities?.allowedTools || []
    };
  }

  validate() {
    if (!this.name || typeof this.name !== 'string') {
      throw new Error('Agent name is required and must be a string');
    }
    if (!this.role || typeof this.role !== 'string') {
      throw new Error('Agent role is required and must be a string');
    }
    if (!this.systemMessage || typeof this.systemMessage !== 'string') {
      throw new Error('System message is required and must be a string');
    }
    return true;
  }

  toJSON() {
    return {
      name: this.name,
      role: this.role,
      systemMessage: this.systemMessage,
      llmConfig: this.llmConfig,
      capabilities: this.capabilities
    };
  }
}

module.exports = {
  AgentConfig
};
