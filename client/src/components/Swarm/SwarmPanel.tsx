import { useState, useEffect } from 'react';
import { useRecoilValue } from 'recoil';
import { useNavigate } from 'react-router-dom';
import { TutorialOverlay } from '~/components/ui';
import { swarmTutorialSteps } from '~/components/ui/Tutorial/config';
import SwarmCreate from '~/components/Swarm/SwarmCreate';
import SwarmMonitor from '~/components/Swarm/SwarmMonitor';
import { Button } from '~/components/ui';
import { useAuthContext } from '~/hooks/AuthContext';
import { useLocalStorage } from '~/hooks';
import store from '~/store';

type TSwarm = {
  _id: string;
  name: string;
  description: string;
  status: 'initializing' | 'running' | 'completed' | 'error';
  project: {
    name: string;
    currentPhase: string;
  };
  agents: Array<{
    role: string;
    status: string;
    currentTask: string;
  }>;
};

export default function SwarmPanel() {
  const [swarms, setSwarms] = useState<TSwarm[]>([]);
  const [selectedSwarm, setSelectedSwarm] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { isAuthenticated } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchSwarms();
  }, [isAuthenticated]);

  const fetchSwarms = async () => {
    try {
      const response = await fetch('/api/swarm', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch swarms');
      const data = await response.json();
      setSwarms(data);
    } catch (error) {
      console.error('Error fetching swarms:', error);
    }
  };

  const handleCreateSwarm = () => {
    setIsCreating(true);
  };

  const handleSwarmCreated = async () => {
    setIsCreating(false);
    await fetchSwarms();
  };

  const handleSelectSwarm = (swarmId: string) => {
    setSelectedSwarm(swarmId);
  };

  const [showTutorial, setShowTutorial] = useState(false);
  const [hasSeenTutorial, setHasSeenTutorial] = useLocalStorage('hasSeenSwarmTutorial', false);

  useEffect(() => {
    // Show swarm tutorial only if not seen before
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, [hasSeenTutorial]);

  const handleTutorialComplete = () => {
    setShowTutorial(false);
    setHasSeenTutorial(true);
  };

  const handleTutorialSkip = () => {
    setShowTutorial(false);
    setHasSeenTutorial(true);
  };

  return (
    <div className="flex h-full flex-col">
      {showTutorial && (
        <TutorialOverlay
          steps={swarmTutorialSteps}
          onComplete={handleTutorialComplete}
          onSkip={handleTutorialSkip}
        />
      )}
      <div className="flex items-center justify-between border-b border-gray-100 p-4 dark:border-gray-800">
        <h2 className="text-lg font-semibold">AI Agent Swarms</h2>
        <Button
          data-tutorial="swarm-create"
          onClick={handleCreateSwarm}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          Create New Swarm
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {isCreating ? (
          <SwarmCreate onCreated={handleSwarmCreated} onCancel={() => setIsCreating(false)} />
        ) : selectedSwarm ? (
          <SwarmMonitor
            swarmId={selectedSwarm}
            onBack={() => setSelectedSwarm(null)}
          />
        ) : (
          <div
            data-tutorial="swarm-monitor"
            className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          >
            {swarms.map((swarm) => (
              <div
                key={swarm._id}
                onClick={() => handleSelectSwarm(swarm._id)}
                className="cursor-pointer rounded-lg border border-gray-200 p-4 hover:border-blue-500 dark:border-gray-700 dark:hover:border-blue-500"
              >
                <h3 className="text-lg font-medium mb-2">{swarm.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {swarm.description}
                </p>
                <div
                  data-tutorial="swarm-output"
                  className="flex justify-between items-center"
                >
                  <span className="text-sm">
                    Phase: {swarm.project.currentPhase}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      swarm.status === 'running'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : swarm.status === 'completed'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : swarm.status === 'error'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}
                  >
                    {swarm.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
