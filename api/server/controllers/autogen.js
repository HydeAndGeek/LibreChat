const { initializeAutoGen, defaultAgents, taskTemplates } = require('../services/autogen/init');

let autoGenService = null;

const initService = async () => {
  if (!autoGenService) {
    const { service } = await initializeAutoGen();
    autoGenService = service;
  }
  return autoGenService;
};

const createAgent = async (req, res) => {
  try {
    const service = await initService();
    const agent = await service.createAgent(req.body);
    res.json(agent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createTeam = async (req, res) => {
  try {
    const service = await initService();
    const team = await service.createTeam(req.body);
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const executeTask = async (req, res) => {
  try {
    const service = await initService();
    const { teamConfig, task } = req.body;

    const team = await service.createTeam(teamConfig);
    const result = await team.executeTask(task);

    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getDefaultAgents = (req, res) => {
  res.json(defaultAgents);
};

const getTaskTemplates = (req, res) => {
  res.json(taskTemplates);
};

const getAgentStatus = async (req, res) => {
  try {
    const service = await initService();
    const agents = Array.from(service.agents.values()).map(agent => ({
      name: agent.name,
      role: agent.role
    }));
    res.json({ agents });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  initService,
  createAgent,
  createTeam,
  executeTask,
  getDefaultAgents,
  getTaskTemplates,
  getAgentStatus
};
