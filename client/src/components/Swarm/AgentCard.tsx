import React from 'react';

interface AgentCardProps {
  agent: {
    role: string;
    status: string;
    currentTask: string;
    prompts: Array<{
      name: string;
      category: string;
    }>;
  };
  phase: string;
}

export default function AgentCard({ agent, phase }: AgentCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working':
        return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200';
    }
  };

  const isActivePhase = () => {
    const phaseMap = {
      ProductManager: 'planning',
      Architect: 'design',
      Engineer: 'implementation',
      QAEngineer: 'testing'
    };
    return phaseMap[agent.role as keyof typeof phaseMap] === phase;
  };

  return (
    <div
      className={`rounded-lg border p-4 ${
        isActivePhase()
          ? 'border-blue-500 dark:border-blue-500'
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">{agent.role}</h3>
        <span
          className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
            agent.status
          )}`}
        >
          {agent.status}
        </span>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {agent.currentTask || 'Waiting for task...'}
        </p>
      </div>

      {agent.prompts.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Active Prompts</h4>
          <div className="space-y-1">
            {agent.prompts.map((prompt, index) => (
              <div
                key={index}
                className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded"
              >
                <span className="font-medium">{prompt.name}</span>
                <span className="text-gray-500 dark:text-gray-400 ml-2">
                  {prompt.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
