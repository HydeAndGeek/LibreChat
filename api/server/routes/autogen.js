const express = require('express');
const autogenController = require('../controllers/autogen');
const { requireJwtAuth } = require('../middleware/auth');

const router = express.Router();

// Initialize AutoGen service
router.get('/init', requireJwtAuth, async (req, res) => {
  try {
    await autogenController.initService();
    res.json({ status: 'initialized' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Agent management
router.post('/agents', requireJwtAuth, autogenController.createAgent);
router.get('/agents/default', requireJwtAuth, autogenController.getDefaultAgents);
router.get('/agents/status', requireJwtAuth, autogenController.getAgentStatus);

// Team management
router.post('/teams', requireJwtAuth, autogenController.createTeam);

// Task management
router.post('/tasks/execute', requireJwtAuth, autogenController.executeTask);
router.get('/tasks/templates', requireJwtAuth, autogenController.getTaskTemplates);

module.exports = router;
