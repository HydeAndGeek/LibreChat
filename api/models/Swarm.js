const { Swarm } = require('./schema/swarmSchema');
const { PromptGroup, Prompt } = require('./schema/promptSchema');
const { logger } = require('~/config');

/**
 * Initialize a new swarm with the specified agents
 * @param {Object} swarmData Initial swarm configuration
 * @returns {Promise<Object>} Created swarm instance
 */
const initializeSwarm = async (swarmData) => {
  try {
    const { name, description, owner, project } = swarmData;

    // Map roles to their prompt categories
    const roleCategories = {
      ProductManager: 'Product Management',
      Architect: 'Architecture',
      Engineer: 'Development',
      QAEngineer: 'Testing'
    };

    // Base agent configurations
    const baseAgents = [
      {
        role: 'ProductManager',
        status: 'idle',
        functions: [{
          name: 'createPRD',
          parameters: [{
            name: 'requirements',
            type: 'string',
            required: true
          }],
          description: 'Create Product Requirements Document'
        }]
      },
      {
        role: 'Architect',
        status: 'idle',
        functions: [{
          name: 'createDesign',
          parameters: [{
            name: 'requirements',
            type: 'string',
            required: true
          }],
          description: 'Create System Design Document'
        }]
      },
      {
        role: 'Engineer',
        status: 'idle',
        functions: [{
          name: 'implement',
          parameters: [{
            name: 'design',
            type: 'object',
            required: true
          }],
          description: 'Implement System Design'
        }]
      },
      {
        role: 'QAEngineer',
        status: 'idle',
        functions: [{
          name: 'test',
          parameters: [{
            name: 'implementation',
            type: 'object',
            required: true
          }],
          description: 'Test Implementation'
        }]
      }
    ];

    // Initialize all agents concurrently with proper error handling
    const initializedAgents = await Promise.all(
      baseAgents.map(async (agent) => {
        try {
          // Create prompt and prompt group concurrently
          const [defaultPrompt, promptGroup] = await Promise.all([
            Prompt.findOneAndUpdate(
              {
                type: 'text',
                prompt: `Default prompt for ${agent.role}`,
              },
              {
                type: 'text',
                prompt: `Default prompt for ${agent.role}`,
                author: owner,
              },
              {
                upsert: true,
                new: true,
                maxTimeMS: 5000
              }
            ),
            PromptGroup.findOneAndUpdate(
              {
                category: roleCategories[agent.role] || agent.role,
                name: `${agent.role} Default`,
              },
              {
                category: roleCategories[agent.role] || agent.role,
                name: `${agent.role} Default`,
                author: owner,
                authorName: 'System'
              },
              {
                upsert: true,
                new: true,
                maxTimeMS: 5000
              }
            )
          ]);

          // Link prompt to group
          promptGroup.productionId = defaultPrompt._id;
          await promptGroup.save({ maxTimeMS: 5000 });

          return {
            ...agent,
            prompts: [promptGroup._id]
          };
        } catch (error) {
          logger.warn(`Failed to create prompts for ${agent.role}:`, error);
          // Return agent with empty prompts rather than failing
          return {
            ...agent,
            prompts: []
          };
        }
      })
    );

    // Create and save swarm with timeout
    const swarm = new Swarm({
      name,
      description,
      owner,
      project,
      agents: initializedAgents,
      status: 'initializing',
      logs: [{
        level: 'info',
        message: 'Swarm initialized with agents',
        timestamp: new Date()
      }]
    });

    await swarm.save({ maxTimeMS: 5000 });
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
