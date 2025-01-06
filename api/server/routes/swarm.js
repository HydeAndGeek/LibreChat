const express = require('express');
const router = express.Router();
const swarmController = require('../controllers/swarm');
const { requireJwtAuth } = require('../middleware/auth');

// Apply JWT authentication to all swarm routes
router.use(requireJwtAuth);

// Create a new swarm
router.post('/', swarmController.createSwarm);

// List all swarms for the authenticated user
router.get('/', swarmController.listSwarms);

// Get detailed information about a specific swarm
router.get('/:swarmId', swarmController.getSwarmDetails);

// Start a swarm's execution
router.post('/:swarmId/start', swarmController.startSwarm);

// Get current status of a swarm
router.get('/:swarmId/status', swarmController.getStatus);

// Update an agent's status within a swarm
router.put('/:swarmId/agents/:agentRole', swarmController.updateAgent);

module.exports = router;
