const { initializeSwarm, startSwarm, updateAgentStatus, getSwarmStatus } = require('../../models/Swarm');
const { logger } = require('~/config');

/**
 * Swarm Controller for managing AI agent swarms
 */
const swarmController = {
  /**
   * Create a new swarm
   * @param {Object} req Request object
   * @param {Object} res Response object
   */
  async createSwarm(req, res) {
    try {
      const { name, description, project } = req.body;
      const owner = req.user.id;

      const swarm = await initializeSwarm({
        name,
        description,
        owner,
        project
      });

      res.status(201).json({
        message: 'Swarm created successfully',
        swarm
      });
    } catch (error) {
      logger.error('Error creating swarm:', error);
      res.status(500).json({ message: 'Failed to create swarm' });
    }
  },

  /**
   * Start swarm execution
   * @param {Object} req Request object
   * @param {Object} res Response object
   */
  async startSwarm(req, res) {
    try {
      const { swarmId } = req.params;
      const swarm = await startSwarm(swarmId);

      res.json({
        message: 'Swarm started successfully',
        swarm
      });
    } catch (error) {
      logger.error('Error starting swarm:', error);
      res.status(500).json({ message: 'Failed to start swarm' });
    }
  },

  /**
   * Update agent status
   * @param {Object} req Request object
   * @param {Object} res Response object
   */
  async updateAgent(req, res) {
    try {
      const { swarmId, agentRole } = req.params;
      const update = req.body;

      const swarm = await updateAgentStatus(swarmId, agentRole, update);

      res.json({
        message: 'Agent updated successfully',
        swarm
      });
    } catch (error) {
      logger.error('Error updating agent:', error);
      res.status(500).json({ message: 'Failed to update agent' });
    }
  },

  /**
   * Get swarm status
   * @param {Object} req Request object
   * @param {Object} res Response object
   */
  async getStatus(req, res) {
    try {
      const { swarmId } = req.params;
      const status = await getSwarmStatus(swarmId);

      res.json(status);
    } catch (error) {
      logger.error('Error getting swarm status:', error);
      res.status(500).json({ message: 'Failed to get swarm status' });
    }
  },

  /**
   * List all swarms for a user
   * @param {Object} req Request object
   * @param {Object} res Response object
   */
  async listSwarms(req, res) {
    try {
      const { Swarm } = require('../../models/schema/swarmSchema');
      const swarms = await Swarm.find({ owner: req.user.id })
        .select('name description status project.currentPhase createdAt updatedAt')
        .sort({ createdAt: -1 });

      res.json(swarms);
    } catch (error) {
      logger.error('Error listing swarms:', error);
      res.status(500).json({ message: 'Failed to list swarms' });
    }
  },

  /**
   * Get detailed swarm information
   * @param {Object} req Request object
   * @param {Object} res Response object
   */
  async getSwarmDetails(req, res) {
    try {
      const { Swarm } = require('../../models/schema/swarmSchema');
      const { swarmId } = req.params;

      const swarm = await Swarm.findOne({
        _id: swarmId,
        owner: req.user.id
      }).populate('agents.prompts', 'name category');

      if (!swarm) {
        return res.status(404).json({ message: 'Swarm not found' });
      }

      res.json(swarm);
    } catch (error) {
      logger.error('Error getting swarm details:', error);
      res.status(500).json({ message: 'Failed to get swarm details' });
    }
  }
};

module.exports = swarmController;
