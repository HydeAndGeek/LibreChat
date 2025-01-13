/**
 * @typedef {Object} AgentConfig
 * @property {string} name - The name of the agent
 * @property {string} role - The role/purpose of the agent
 * @property {string} systemMessage - The system message that defines the agent's behavior
 */

/**
 * @typedef {Object} TaskStep
 * @property {string} prompt - The prompt/instruction for this step
 */

/**
 * @typedef {Object} Task
 * @property {string} initiator - The name of the agent that initiates this task
 * @property {TaskStep[]} steps - The sequence of steps to complete the task
 */

/**
 * @typedef {Object} TeamConfig
 * @property {AgentConfig[]} agents - The agents that make up the team
 * @property {Task[]} tasks - The tasks for the team to complete
 */

/**
 * @typedef {Object} Message
 * @property {string} role - The role of the message sender (user/assistant)
 * @property {string} content - The content of the message
 */

/**
 * @typedef {Object} Agent
 * @property {string} name - The name of the agent
 * @property {string} role - The role/purpose of the agent
 * @property {string} systemMessage - The system message that defines the agent's behavior
 * @property {function(Message[]): Promise<string>} sendMessage - Function to send messages to the agent
 */

/**
 * @typedef {Object} Team
 * @property {Agent[]} agents - The agents in the team
 * @property {Task[]} tasks - The tasks assigned to the team
 * @property {function(): Promise<Message[][]>} run - Function to execute all tasks
 * @property {function(Task): Promise<Message[]>} executeTask - Function to execute a single task
 */

export {};
