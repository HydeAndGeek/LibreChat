const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const swarmAgentSchema = new Schema({
  role: {
    type: String,
    required: true,
    enum: ['ProductManager', 'Architect', 'Engineer', 'QAEngineer'],
  },
  status: {
    type: String,
    required: true,
    enum: ['idle', 'working', 'completed', 'error'],
    default: 'idle',
  },
  currentTask: {
    type: String,
    default: '',
  },
  prompts: [{
    type: Schema.Types.ObjectId,
    ref: 'PromptGroup',
  }],
  output: {
    type: Schema.Types.Mixed,
    default: null,
  },
}, { timestamps: true });

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
