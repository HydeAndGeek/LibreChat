const { Swarm } = require('./schema/swarmSchema');
const { PromptGroup } = require('./schema/promptSchema');
const { logger } = require('~/config');

/**
 * Initialize a new swarm with the specified agents
 * @param {Object} swarmData Initial swarm configuration
 * @returns {Promise<Object>} Created swarm instance
 */
const initializeSwarm = async (swarmData) => {
  try {
    const { name, description, owner, project } = swarmData;

    // Create base agents for the swarm
    const baseAgents = [
      { role: 'ProductManager', status: 'idle' },
      { role: 'Architect', status: 'idle' },
      { role: 'Engineer', status: 'idle' },
      { role: 'QAEngineer', status: 'idle' }
    ];

    // Map roles to their prompt categories
    const roleCategories = {
      ProductManager: 'Product Management',
      Architect: 'Architecture',
      Engineer: 'Development',
      QAEngineer: 'Testing'
    };

    // Load relevant prompts for each agent
    for (const agent of baseAgents) {
      try {
        const rolePrompts = await PromptGroup.find({
          category: roleCategories[agent.role] || agent.role,
          name: { $regex: new RegExp(agent.role, 'i') }
        }).select('_id');

        agent.prompts = rolePrompts.map(p => p._id);
      } catch (error) {
        logger.warn(`Failed to load prompts for ${agent.role}:`, error);
        agent.prompts = []; // Continue with empty prompts rather than failing
      }
    }

    const swarm = new Swarm({
      name,
      description,
      owner,
      project,
      agents: baseAgents,
      status: 'initializing'
    });

    await swarm.save();
    return swarm;
  } catch (error) {
    logger.error('Error initializing swarm:', error);
    throw new Error('Failed to initialize swarm');
  }
};

/**
 * Start swarm execution
 * @param {String} swarmId ID of the swarm to start
 * @returns {Promise<Object>} Updated swarm instance
 */
const startSwarm = async (swarmId) => {
  try {
    const swarm = await Swarm.findById(swarmId);
    if (!swarm) {
      throw new Error('Swarm not found');
    }

    // Start with Product Manager
    const pm = swarm.agents.find(a => a.role === 'ProductManager');
    if (!pm) {
      throw new Error('Product Manager agent not found');
    }

    pm.status = 'working';
    pm.currentTask = 'Creating PRD';
    swarm.status = 'running';
    swarm.project.currentPhase = 'planning';

    await swarm.save();
    return swarm;
  } catch (error) {
    logger.error('Error starting swarm:', error);
    throw new Error('Failed to start swarm');
  }
};

/**
 * Update agent status and progress
 * @param {String} swarmId ID of the swarm
 * @param {String} agentRole Role of the agent to update
 * @param {Object} update Update data
 * @returns {Promise<Object>} Updated swarm instance
 */
const updateAgentStatus = async (swarmId, agentRole, update) => {
  try {
    const swarm = await Swarm.findById(swarmId);
    if (!swarm) {
      throw new Error('Swarm not found');
    }

    const agent = swarm.agents.find(a => a.role === agentRole);
    if (!agent) {
      throw new Error('Agent not found');
    }

    // Update agent status
    Object.assign(agent, update);

    // Update project phase based on agent completion
    if (update.status === 'completed') {
      const phases = {
        ProductManager: 'design',
        Architect: 'implementation',
        Engineer: 'testing',
        QAEngineer: 'completed'
      };

      const nextPhase = phases[agentRole];
      if (nextPhase) {
        swarm.project.currentPhase = nextPhase;

        // Activate next agent
        const nextAgentRoles = {
          ProductManager: 'Architect',
          Architect: 'Engineer',
          Engineer: 'QAEngineer'
        };

        const nextRole = nextAgentRoles[agentRole];
        if (nextRole) {
          const nextAgent = swarm.agents.find(a => a.role === nextRole);
          if (nextAgent) {
            nextAgent.status = 'working';
            nextAgent.currentTask = `Working on ${nextPhase} phase`;
          }
        }

        // Check if project is complete
        if (agentRole === 'QAEngineer') {
          swarm.status = 'completed';
        }
      }
    }

    // Add log entry
    swarm.logs.push({
      level: 'info',
      message: `${agentRole}: ${update.currentTask || 'Status updated'}`,
      agent: agentRole
    });

    await swarm.save();
    return swarm;
  } catch (error) {
    logger.error('Error updating agent status:', error);
    throw new Error('Failed to update agent status');
  }
};

/**
 * Get swarm status and progress
 * @param {String} swarmId ID of the swarm
 * @returns {Promise<Object>} Swarm status and progress
 */
const getSwarmStatus = async (swarmId) => {
  try {
    const swarm = await Swarm.findById(swarmId)
      .populate('agents.prompts', 'name category')
      .select('-__v');

    if (!swarm) {
      throw new Error('Swarm not found');
    }

    return {
      status: swarm.status,
      project: swarm.project,
      agents: swarm.agents.map(agent => ({
        role: agent.role,
        status: agent.status,
        currentTask: agent.currentTask,
        prompts: agent.prompts
      })),
      output: swarm.output,
      logs: swarm.logs.slice(-10) // Get last 10 logs
    };
  } catch (error) {
    logger.error('Error getting swarm status:', error);
    throw new Error('Failed to get swarm status');
  }
};

module.exports = {
  initializeSwarm,
  startSwarm,
  updateAgentStatus,
  getSwarmStatus
};
