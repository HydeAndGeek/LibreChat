jest.mock('@modelcontextprotocol/sdk/client', () => require('../mocks/mcp'));

const AutoGenService = require('../../server/services/autogen/service');
const { defaultAgents, taskTemplates } = require('../../server/services/autogen/init');
const { use_mcp_tool, mockMcpResponse } = require('../mocks/mcp');

beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  // Clear agents map
  AutoGenService.agents.clear();
});

describe('AutoGen Service', () => {
  describe('Agent Management', () => {
    test('should create an agent with valid config', async () => {
      const config = defaultAgents.coder;
      const agent = await AutoGenService.createAgent(config);

      expect(agent).toBeDefined();
      expect(agent.name).toBe(config.name);
      expect(agent.role).toBe(config.role);
      expect(agent.systemMessage).toBe(config.systemMessage);
      expect(typeof agent.sendMessage).toBe('function');
    });

    test('should store created agent in agents map', async () => {
      const config = defaultAgents.reviewer;
      const agent = await AutoGenService.createAgent(config);

      expect(AutoGenService.agents.get(config.name)).toBe(agent);
    });
  });

  describe('Team Management', () => {
    test('should create a team with multiple agents', async () => {
      const config = {
        agents: [defaultAgents.coder, defaultAgents.reviewer],
        tasks: []
      };

      const team = await AutoGenService.createTeam(config);

      expect(team.agents).toHaveLength(2);
      expect(team.agents[0].name).toBe(defaultAgents.coder.name);
      expect(team.agents[1].name).toBe(defaultAgents.reviewer.name);
    });

    test('should execute task with correct agent', async () => {
      const team = await AutoGenService.createTeam({
        agents: [defaultAgents.coder],
        tasks: []
      });

      const task = {
        initiator: defaultAgents.coder.name,
        steps: [
          {
            prompt: 'Write a hello world function'
          }
        ]
      };

      const result = await team.executeTask(task);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2); // prompt + response
      expect(use_mcp_tool).toHaveBeenCalledWith('claude', 'chat', expect.any(Object));
      expect(result[1].content).toBe(mockMcpResponse.content);
    });
  });

  describe('Task Templates', () => {
    test('should have valid code review template', () => {
      const template = taskTemplates.codeReview;
      expect(template.initiator).toBe('reviewer');
      expect(Array.isArray(template.steps)).toBe(true);
      expect(template.steps.length).toBeGreaterThan(0);
    });

    test('should have valid bug fix template', () => {
      const template = taskTemplates.bugFix;
      expect(template.initiator).toBe('coder');
      expect(Array.isArray(template.steps)).toBe(true);
      expect(template.steps.length).toBeGreaterThan(0);
    });
  });
});
