jest.mock('@modelcontextprotocol/sdk/client', () => require('../mocks/mcp'));
jest.mock('../../server/services/autogen/service');

const request = require('supertest');
const express = require('express');
const autogenController = require('../../server/controllers/autogen');
const AutoGenService = require('../../server/services/autogen/service');
const { defaultAgents, taskTemplates } = require('../../server/services/autogen/init');

describe('AutoGen Controller', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock routes
    app.get('/init', autogenController.initService);
    app.post('/agents', autogenController.createAgent);
    app.get('/agents/default', autogenController.getDefaultAgents);
    app.get('/agents/status', autogenController.getAgentStatus);
    app.post('/teams', autogenController.createTeam);
    app.post('/tasks/execute', autogenController.executeTask);
    app.get('/tasks/templates', autogenController.getTaskTemplates);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('GET /init', () => {
    test('should initialize AutoGen service', async () => {
      const response = await request(app).get('/init');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'initialized' });
    });
  });

  describe('POST /agents', () => {
    test('should create a new agent', async () => {
      const mockAgent = {
        name: 'test-agent',
        role: 'tester',
        systemMessage: 'Test system message'
      };

      AutoGenService.createAgent.mockResolvedValue(mockAgent);

      const response = await request(app)
        .post('/agents')
        .send(mockAgent);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockAgent);
      expect(AutoGenService.createAgent).toHaveBeenCalledWith(mockAgent);
    });
  });

  describe('GET /agents/default', () => {
    test('should return default agent configurations', async () => {
      const response = await request(app).get('/agents/default');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(defaultAgents);
    });
  });

  describe('GET /agents/status', () => {
    test('should return current agent status', async () => {
      const mockAgents = [
        { name: 'agent1', role: 'role1' },
        { name: 'agent2', role: 'role2' }
      ];

      AutoGenService.agents = new Map(
        mockAgents.map(agent => [agent.name, agent])
      );

      const response = await request(app).get('/agents/status');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ agents: mockAgents });
    });
  });

  describe('POST /teams', () => {
    test('should create a new team', async () => {
      const mockTeam = {
        agents: [defaultAgents.coder, defaultAgents.reviewer],
        tasks: []
      };

      AutoGenService.createTeam.mockResolvedValue(mockTeam);

      const response = await request(app)
        .post('/teams')
        .send(mockTeam);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockTeam);
      expect(AutoGenService.createTeam).toHaveBeenCalledWith(mockTeam);
    });
  });

  describe('POST /tasks/execute', () => {
    test('should execute a task', async () => {
      const mockRequest = {
        teamConfig: {
          agents: [defaultAgents.coder],
          tasks: []
        },
        task: {
          initiator: 'coder',
          steps: [{ prompt: 'Test prompt' }]
        }
      };

      const mockResult = [
        { role: 'user', content: 'Test prompt' },
        { role: 'assistant', content: 'Test response' }
      ];

      const mockTeam = {
        executeTask: jest.fn().mockResolvedValue(mockResult)
      };

      AutoGenService.createTeam.mockResolvedValue(mockTeam);

      const response = await request(app)
        .post('/tasks/execute')
        .send(mockRequest);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ result: mockResult });
      expect(AutoGenService.createTeam).toHaveBeenCalledWith(mockRequest.teamConfig);
      expect(mockTeam.executeTask).toHaveBeenCalledWith(mockRequest.task);
    });
  });

  describe('GET /tasks/templates', () => {
    test('should return task templates', async () => {
      const response = await request(app).get('/tasks/templates');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(taskTemplates);
    });
  });
});
