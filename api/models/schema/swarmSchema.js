const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const functionSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  parameters: [{
    name: String,
    type: String,
    required: Boolean
  }],
  description: String,
  output: Schema.Types.Mixed
});

const swarmAgentSchema = new Schema({
  role: {
    type: String,
    required: true,
    enum: [
      'ProductManager',
      'Architect',
      'Engineer',
      'QAEngineer'
    ]
  },
  status: {
    type: String,
    required: true,
    enum: ['idle', 'working', 'completed', 'error'],
    default: 'idle'
  },
  currentTask: {
    type: String,
    default: ''
  },
  prompts: [{
    type: Schema.Types.ObjectId,
    ref: 'PromptGroup'
  }],
  functions: [functionSchema],
  output: {
    type: Schema.Types.Mixed,
    default: null
  },
  dependencies: [{
    role: String,
    requiredOutput: [String]
  }]
}, { timestamps: true });

// Add methods for function execution
swarmAgentSchema.methods.executeFunction = async function(functionName, params) {
  const fn = this.functions.find(f => f.name === functionName);
  if (!fn) throw new Error(`Function ${functionName} not found`);

  try {
    // Validate required parameters
    fn.parameters.forEach(param => {
      if (param.required && !(param.name in params)) {
        throw new Error(`Required parameter ${param.name} missing`);
      }
    });

    // Execute function based on role and function name
    switch(this.role) {
      case 'ProductManager':
        return await this.executePMFunction(fn, params);
      case 'Architect':
        return await this.executeArchitectFunction(fn, params);
      case 'Engineer':
        return await this.executeEngineerFunction(fn, params);
      case 'QAEngineer':
        return await this.executeQAFunction(fn, params);
      default:
        throw new Error(`Unknown role ${this.role}`);
    }
  } catch (error) {
    this.status = 'error';
    throw error;
  }
};

// Role-specific function execution
swarmAgentSchema.methods.executePMFunction = async function(fn, params) {
  switch(fn.name) {
    case 'createPRD':
      return {
        type: 'prd',
        content: params.requirements
      };
    default:
      throw new Error(`Unknown PM function ${fn.name}`);
  }
};

swarmAgentSchema.methods.executeArchitectFunction = async function(fn, params) {
  switch(fn.name) {
    case 'createDesign':
      return {
        type: 'design',
        content: params.requirements
      };
    default:
      throw new Error(`Unknown Architect function ${fn.name}`);
  }
};

swarmAgentSchema.methods.executeEngineerFunction = async function(fn, params) {
  switch(fn.name) {
    case 'implement':
      return {
        type: 'implementation',
        content: params.design
      };
    default:
      throw new Error(`Unknown Engineer function ${fn.name}`);
  }
};

swarmAgentSchema.methods.executeQAFunction = async function(fn, params) {
  switch(fn.name) {
    case 'test':
      return {
        type: 'testReport',
        content: params.implementation
      };
    default:
      throw new Error(`Unknown QA function ${fn.name}`);
  }
};

// Add method for agent collaboration
swarmAgentSchema.methods.collaborate = async function(targetAgent, functionName, params) {
  if (!this.dependencies.some(d => d.role === targetAgent.role)) {
    throw new Error(`No dependency defined for collaboration with ${targetAgent.role}`);
  }

  return await targetAgent.executeFunction(functionName, params);
};

const swarmSchema = new Schema({
  name: {
    type: String,
    required: true,
    index: true,
  },
  description: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    required: true,
    enum: ['initializing', 'running', 'completed', 'error'],
    default: 'initializing',
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  agents: [swarmAgentSchema],
  project: {
    name: String,
    requirements: String,
    currentPhase: {
      type: String,
      enum: ['planning', 'design', 'implementation', 'testing'],
      default: 'planning',
    },
  },
  output: {
    prd: Schema.Types.Mixed,
    design: Schema.Types.Mixed,
    implementation: Schema.Types.Mixed,
    testReport: Schema.Types.Mixed,
  },
  logs: [{
    timestamp: {
      type: Date,
      default: Date.now,
    },
    level: {
      type: String,
      enum: ['info', 'warning', 'error'],
      default: 'info',
    },
    message: String,
    agent: String,
  }],
}, { timestamps: true });

// Indexes for efficient querying
swarmSchema.index({ createdAt: 1, updatedAt: 1 });
swarmSchema.index({ owner: 1, status: 1 });
swarmSchema.index({ 'project.currentPhase': 1 });

const Swarm = mongoose.model('Swarm', swarmSchema);

module.exports = { Swarm };
