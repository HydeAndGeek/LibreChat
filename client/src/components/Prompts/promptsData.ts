interface Prompt {
  title: string;
  description: string;
  content: string;
  tags: string[];
}

interface PromptCategory {
  name: string;
  description: string;
  prompts: Prompt[];
}

export const promptCategories: PromptCategory[] = [
  {
    name: 'Product Planning',
    description: 'Templates for product vision, strategy, and planning',
    prompts: [
      {
        title: 'User Story Template',
        description: 'Create well-structured user stories with acceptance criteria',
        content: `### User Story [Story ID]:

- **Summary**: [brief, memorable title describing value to user]

#### Use Case:
- **As a** [user persona/role],
- **I want to** [action to take],
- **so that** [desired outcome].

#### Acceptance Criteria:
- **Scenario**: [user scenario]
- **Given**: [initial context]
- **When**: [event occurs]
- **Then**: [expected outcome]`,
        tags: ['user-stories', 'requirements', 'agile']
      },
      {
        title: 'Problem Statement',
        description: 'Frame the problem clearly before building solutions',
        content: `# Problem Statement Framework

1. Current Situation:
   - What is happening now?
   - Who is affected?

2. Impact:
   - What are the consequences?
   - What is the cost of not solving this?

3. Desired Outcome:
   - What does success look like?
   - How will we measure it?`,
        tags: ['problem-framing', 'strategy']
      }
    ]
  },
  {
    name: 'Research & Analysis',
    description: 'Templates for market research and analysis',
    prompts: [
      {
        title: 'Customer Journey Map',
        description: 'Map out the customer experience journey',
        content: `# Customer Journey Mapping

1. Customer Persona:
   [Define who we're mapping]

2. Journey Phases:
   - Awareness
   - Consideration
   - Decision
   - Onboarding
   - Usage
   - Support
   - Loyalty

3. For each phase, analyze:
   - Actions
   - Thoughts
   - Feelings
   - Pain Points
   - Opportunities`,
        tags: ['research', 'customer-experience']
      },
      {
        title: 'PESTEL Analysis',
        description: 'Analyze external factors affecting the product',
        content: `# PESTEL Analysis Framework

Analyze each factor's impact on our product:

1. Political factors:
   [Government policies, regulations]

2. Economic factors:
   [Market conditions, economic trends]

3. Social factors:
   [Demographics, cultural trends]

4. Technological factors:
   [Tech advances, innovation]

5. Environmental factors:
   [Sustainability concerns]

6. Legal factors:
   [Laws, compliance requirements]`,
        tags: ['market-analysis', 'strategy']
      }
    ]
  },
  {
    name: 'Development & Documentation',
    description: 'Templates for technical documentation and development',
    prompts: [
      {
        title: 'PRD Template',
        description: 'Create comprehensive product requirements documents',
        content: `# Product Requirements Document

1. Product Overview
   - Purpose
   - Target Users
   - Key Features

2. Requirements
   - Functional Requirements
   - Non-functional Requirements
   - Technical Requirements

3. User Stories
   [Include detailed user stories]

4. Acceptance Criteria
   [Define success criteria]

5. Technical Specifications
   [Include technical details]`,
        tags: ['documentation', 'requirements']
      },
      {
        title: 'API Documentation',
        description: 'Document API endpoints and usage',
        content: `# API Documentation Template

## Endpoint: [Method] /path

### Description
[What this endpoint does]

### Request
\`\`\`json
{
  "field": "type and description"
}
\`\`\`

### Response
\`\`\`json
{
  "field": "type and description"
}
\`\`\`

### Error Codes
- 400: [description]
- 401: [description]
- 403: [description]
- 404: [description]
- 500: [description]`,
        tags: ['api', 'documentation', 'technical']
      }
    ]
  }
];
