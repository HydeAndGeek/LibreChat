import type { TutorialStep } from './types';

export const tutorialSteps: TutorialStep[] = [
  {
    target: '[data-tutorial="new-chat"]',
    title: 'Start a New Chat',
    content: 'Begin a new conversation with any AI model. LibreChat supports various models including GPT-4, Claude, and others.',
    position: 'right'
  },
  {
    target: '[data-tutorial="prompts-library"]',
    title: 'Prompt Library',
    content: 'Access our extensive library of professional prompts for product management, development, and more.',
    position: 'right'
  },
  {
    target: '[data-tutorial="prompts-category"]',
    title: 'Browse Categories',
    content: 'Explore different categories of prompts, from product planning to technical documentation.',
    position: 'right'
  },
  {
    target: '[data-tutorial="prompt-template"]',
    title: 'Use Templates',
    content: 'Click any template to start a new chat with that prompt pre-filled. Perfect for common tasks.',
    position: 'right'
  },
  {
    target: '[data-tutorial="swarm-nav"]',
    title: 'AI Agent Swarms',
    content: 'Create autonomous agent teams that work together on complex projects using MetaGPT technology.',
    position: 'right'
  },
  {
    target: '[data-tutorial="settings"]',
    title: 'Configure Your Experience',
    content: 'Set up your API keys, customize the interface, and manage your preferences here.',
    position: 'top'
  }
];

export const swarmTutorialSteps: TutorialStep[] = [
  {
    target: '[data-tutorial="swarm-create"]',
    title: 'Create a Swarm',
    content: 'Start by creating a new AI agent swarm. Name your project and describe what you want to build.',
    position: 'right'
  },
  {
    target: '[data-tutorial="swarm-agents"]',
    title: 'Meet Your Agents',
    content: 'Your swarm includes specialized agents powered by MetaGPT:\n\n• Product Manager: Plans and defines requirements\n• Architect: Designs system architecture\n• Engineer: Implements solutions\n• QA: Tests and validates',
    position: 'bottom'
  },
  {
    target: '[data-tutorial="swarm-monitor"]',
    title: 'Monitor Progress',
    content: 'Track your swarm\'s progress through different phases: planning, design, implementation, and testing. Each agent works autonomously while coordinating with others.',
    position: 'right'
  },
  {
    target: '[data-tutorial="swarm-output"]',
    title: 'View Results',
    content: 'See the output from each agent, including PRDs, architecture diagrams, code, and test reports. All generated using professional templates from our prompt library.',
    position: 'left'
  }
];

export const promptsTutorialSteps: TutorialStep[] = [
  {
    target: '[data-tutorial="prompts-library"]',
    title: 'Welcome to the Prompt Library',
    content: 'This library contains professional-grade prompts from the product-manager-prompts repository, organized by category.',
    position: 'right'
  },
  {
    target: '[data-tutorial="prompts-category"]',
    title: 'Prompt Categories',
    content: 'Browse different categories like Product Planning, Research & Analysis, and Development. Click any category to see its prompts.',
    position: 'right'
  },
  {
    target: '[data-tutorial="prompt-template"]',
    title: 'Using Templates',
    content: 'Each template is designed for a specific task. Click a template to start a new chat with the prompt pre-filled. Tags show you what each template is best for.',
    position: 'right'
  }
];
