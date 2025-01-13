const AutoGenService = require('./service');

/**
 * Default agent configurations for common roles
 */
const defaultAgents = {
  coder: {
    name: 'coder',
    role: 'Software Engineer',
    systemMessage: `You are an expert software engineer with deep knowledge of programming languages, frameworks, and best practices.
    Your role is to write high-quality code, review code, debug issues, and provide technical solutions.`
  },
  reviewer: {
    name: 'reviewer',
    role: 'Code Reviewer',
    systemMessage: `You are an experienced code reviewer who focuses on code quality, maintainability, and best practices.
    Your role is to review code changes, identify potential issues, and suggest improvements.`
  },
  architect: {
    name: 'architect',
    role: 'Software Architect',
    systemMessage: `You are a skilled software architect with expertise in system design, patterns, and architecture best practices.
    Your role is to design scalable solutions, make architectural decisions, and ensure system quality.`
  },
  tester: {
    name: 'tester',
    role: 'QA Engineer',
    systemMessage: `You are a thorough QA engineer who specializes in testing methodologies and quality assurance.
    Your role is to write tests, identify bugs, and ensure software quality.`
  }
};

/**
 * Default task templates for common development workflows
 */
const taskTemplates = {
  codeReview: {
    initiator: 'reviewer',
    steps: [
      {
        prompt: 'Review the following code changes and provide feedback:\n{code}'
      },
      {
        prompt: 'Summarize the key findings and recommendations from the review.'
      }
    ]
  },
  bugFix: {
    initiator: 'coder',
    steps: [
      {
        prompt: 'Analyze the following bug report and propose a solution:\n{bugReport}'
      },
      {
        prompt: 'Implement the proposed fix and explain the changes.'
      },
      {
        prompt: 'Write tests to verify the fix and prevent regression.'
      }
    ]
  },
  featureImplementation: {
    initiator: 'architect',
    steps: [
      {
        prompt: 'Design the architecture for the following feature:\n{featureSpec}'
      },
      {
        prompt: 'Create a detailed implementation plan.'
      },
      {
        prompt: 'Review and refine the implementation plan.'
      }
    ]
  }
};

/**
 * Initialize the AutoGen service with default configurations
 */
async function initializeAutoGen() {
  // Create default agents
  const agents = await Promise.all(
    Object.values(defaultAgents).map(config =>
      AutoGenService.createAgent(config)
    )
  );

  // Log initialization status
  console.log('AutoGen service initialized with agents:',
    agents.map(agent => agent.name).join(', ')
  );

  return {
    service: AutoGenService,
    defaultAgents,
    taskTemplates
  };
}

module.exports = {
  initializeAutoGen,
  defaultAgents,
  taskTemplates
};
