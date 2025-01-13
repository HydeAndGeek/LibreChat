const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const promptSchema = new Schema({
  text: {
    type: String,
    required: true
  },
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
    prompt: String
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
    {
      name: "Product Manager Prompts",
      category: "Product Management",
      prompts: [
        {
          text: "Create a detailed product requirements document (PRD) that outlines the project goals, features, and success criteria."
        },
        {
          text: "Review and prioritize features based on user needs and technical constraints."
        }
      ]
    },
    {
      name: "Architect Prompts",
      category: "Architecture",
      prompts: [
        {
          text: "Design a scalable and maintainable system architecture that meets the project requirements."
        },
        {
          text: "Evaluate and select appropriate technologies and frameworks for the project."
        }
      ]
    },
    {
      name: "Engineer Prompts",
      category: "Development",
      prompts: [
        {
          text: "Implement features according to the technical specifications and best practices."
        },
        {
          text: "Write clean, efficient, and well-documented code."
        }
      ]
    },
    {
      name: "QA Engineer Prompts",
      category: "Testing",
      prompts: [
        {
          text: "Create and execute comprehensive test plans to ensure code quality."
        },
        {
          text: "Identify and document bugs, and verify bug fixes."
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
