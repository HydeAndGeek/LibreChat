import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CircleHelpIcon } from '~/components/svg';
import { TutorialOverlay } from './';
import { tutorialSteps, swarmTutorialSteps } from './config';

export default function HelpButton() {
  const [showTutorial, setShowTutorial] = useState(false);
  const location = useLocation();

  const isSwarmRoute = location.pathname.startsWith('/swarm');
  const steps = isSwarmRoute ? swarmTutorialSteps : tutorialSteps;

  const handleShowTutorial = () => {
    setShowTutorial(true);
  };

  const handleComplete = () => {
    setShowTutorial(false);
  };

  const handleSkip = () => {
    setShowTutorial(false);
  };

  return (
    <>
      <button
        onClick={handleShowTutorial}
        className="fixed bottom-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
        title="Show Tutorial"
      >
        <CircleHelpIcon className="h-6 w-6" />
      </button>
      {showTutorial && (
        <TutorialOverlay
          steps={steps}
          onComplete={handleComplete}
          onSkip={handleSkip}
        />
      )}
    </>
  );
}
