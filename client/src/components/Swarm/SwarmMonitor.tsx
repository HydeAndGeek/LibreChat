import { useState, useEffect } from 'react';
import { Button } from '~/components/ui';
import AgentCard from '~/components/Swarm/AgentCard';

interface SwarmMonitorProps {
  swarmId: string;
  onBack: () => void;
}

interface SwarmStatus {
  status: 'initializing' | 'running' | 'completed' | 'error';
  project: {
    name: string;
    currentPhase: string;
  };
  agents: Array<{
    role: string;
    status: string;
    currentTask: string;
    prompts: Array<{
      name: string;
      category: string;
    }>;
  }>;
  output: {
    prd?: any;
    design?: any;
    implementation?: any;
    testReport?: any;
  };
  logs: Array<{
    timestamp: string;
    level: string;
    message: string;
    agent: string;
  }>;
}

export default function SwarmMonitor({ swarmId, onBack }: SwarmMonitorProps) {
  const [swarmStatus, setSwarmStatus] = useState<SwarmStatus | null>(null);
  const [error, setError] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/swarm/${swarmId}/status`);
        if (!response.ok) throw new Error('Failed to fetch swarm status');
        const data = await response.json();
        setSwarmStatus(data);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('Failed to fetch swarm status');
        }
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [swarmId]);

  const handleStartSwarm = async () => {
    setIsStarting(true);
    try {
      const response = await fetch(`/api/swarm/${swarmId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to start swarm');
      }

      // Refresh status immediately after starting
      const statusResponse = await fetch(`/api/swarm/${swarmId}/status`);
      if (statusResponse.ok) {
        const data = await statusResponse.json();
        setSwarmStatus(data);
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to start swarm');
      }
    } finally {
      setIsStarting(false);
    }
  };

  if (!swarmStatus) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'planning':
        return 'text-yellow-500';
      case 'design':
        return 'text-blue-500';
      case 'implementation':
        return 'text-green-500';
      case 'testing':
        return 'text-purple-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <Button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            ← Back
          </Button>
          {swarmStatus.status === 'initializing' && (
            <Button
              onClick={handleStartSwarm}
              disabled={isStarting}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {isStarting ? 'Starting...' : 'Start Swarm'}
            </Button>
          )}
        </div>

        <h2 className="text-2xl font-bold">{swarmStatus.project.name}</h2>
        <div className="flex items-center mt-2">
          <span className="text-sm text-gray-500 dark:text-gray-400 mr-4">
            Status: {swarmStatus.status}
          </span>
          <span className={`text-sm ${getPhaseColor(swarmStatus.project.currentPhase)}`}>
            Phase: {swarmStatus.project.currentPhase}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6" data-tutorial="swarm-agents">
          {swarmStatus.agents.map((agent) => (
            <AgentCard
              key={agent.role}
              agent={agent}
              phase={swarmStatus.project.currentPhase}
            />
          ))}
        </div>

        {error && (
          <div className="text-red-500 text-sm p-2 bg-red-50 dark:bg-red-900/50 rounded mb-4">
            {error}
          </div>
        )}

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4" data-tutorial="swarm-output">
          <h3 className="text-lg font-semibold mb-2">Activity Log</h3>
          <div className="space-y-2">
            {swarmStatus.logs.map((log, index) => (
              <div
                key={index}
                className={`text-sm p-2 rounded ${
                  log.level === 'error'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'
                    : log.level === 'warning'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200'
                    : 'bg-white dark:bg-gray-700'
                }`}
              >
                <span className="text-gray-500 dark:text-gray-400">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className="mx-2">|</span>
                <span className="font-medium">{log.agent}:</span>
                <span className="ml-2">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
