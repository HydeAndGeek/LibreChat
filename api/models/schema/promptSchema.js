const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const promptSchema = new Schema({
  text: {
    type: String,
    required: true
  },
  functions: [String],
  type: {
    type: String,
    enum: ['text', 'code', 'data'],
    default: 'text'
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

const promptGroupSchema = new Schema({
  name: {
    type: String,
    required: true,
    index: true
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  prompts: [{
    text: String,
    functions: [String]
  }],
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  authorName: String,
  productionId: {
    type: Schema.Types.ObjectId,
    ref: 'Prompt'
  }
}, { timestamps: true });

// Initialize default prompt groups
promptGroupSchema.statics.initializeDefaultGroups = async function(userId) {
  const defaultGroups = [
    // Executive Team
    {
      name: "CEO Prompts",
      category: "Executive",
      prompts: [
        {
          text: "Create company vision and strategy",
          functions: ["defineVision", "createStrategy", "setGoals"]
        },
        {
          text: "Analyze market opportunities and threats",
          functions: ["marketAnalysis", "competitorAnalysis"]
        }
      ]
    },
    {
      name: "CTO Prompts",
      category: "Executive",
      prompts: [
        {
          text: "Define technical roadmap and architecture",
          functions: ["createTechRoadmap", "architectureReview"]
        },
        {
          text: "Evaluate new technologies and innovations",
          functions: ["techEvaluation", "innovationAssessment"]
        }
      ]
    },
    // Research Team
    {
      name: "Research Lead Prompts",
      category: "Research",
      prompts: [
        {
          text: "Design research methodology and experiments",
          functions: ["researchDesign", "experimentPlanning"]
        },
        {
          text: "Analyze research findings and create reports",
          functions: ["dataAnalysis", "reportGeneration"]
        }
      ]
    },
    // Development Team
    {
      name: "Frontend Engineer Prompts",
      category: "Development",
      prompts: [
        {
          text: "Develop user interfaces and components",
          functions: ["uiDevelopment", "componentCreation"]
        },
        {
          text: "Implement user interactions and animations",
          functions: ["interactionDesign", "animationDevelopment"]
        }
      ]
    },
    {
      name: "Backend Engineer Prompts",
      category: "Development",
      prompts: [
        {
          text: "Design and implement APIs",
          functions: ["apiDevelopment", "serviceIntegration"]
        },
        {
          text: "Optimize database performance",
          functions: ["dbOptimization", "queryTuning"]
        }
      ]
    },
    // Project Management
    {
      name: "Scrum Master Prompts",
      category: "Project Management",
      prompts: [
        {
          text: "Facilitate agile ceremonies",
          functions: ["sprintPlanning", "retrospectiveFacilitation"]
        },
        {
          text: "Remove team impediments",
          functions: ["impedimentResolution", "processImprovement"]
        }
      ]
    }
  ];

  for (const group of defaultGroups) {
    await this.findOneAndUpdate(
      { name: group.name },
      {
        ...group,
        author: userId,
        authorName: 'System'
      },
      { upsert: true, new: true }
    );
  }
};

const PromptGroup = mongoose.model('PromptGroup', promptGroupSchema);
const Prompt = mongoose.model('Prompt', promptSchema);

module.exports = { PromptGroup, Prompt };
