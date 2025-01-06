import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '~/hooks';
import { tutorialSteps } from './config';
import type { TutorialProps } from './types';

export default function TutorialOverlay({
  steps = tutorialSteps,
  onComplete,
  onSkip
}: TutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [hasSeenTutorial, setHasSeenTutorial] = useLocalStorage('hasSeenTutorial', false);

  useEffect(() => {
    if (!hasSeenTutorial) {
      setIsVisible(true);
    }
  }, [hasSeenTutorial]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsVisible(false);
      setHasSeenTutorial(true);
      onComplete?.();
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    setHasSeenTutorial(true);
    onSkip?.();
  };

  if (!isVisible) return null;

  const currentTutorial = steps[currentStep];
  const targetElement = document.querySelector(currentTutorial.target);
  const targetRect = targetElement?.getBoundingClientRect();

  if (!targetRect) return null;

  const getOverlayStyle = (): React.CSSProperties => {
    return {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 9998,
      pointerEvents: 'auto'
    };
  };

  const getHighlightStyle = (): React.CSSProperties => {
    return {
      position: 'fixed',
      top: targetRect.top - 10,
      left: targetRect.left - 10,
      width: targetRect.width + 20,
      height: targetRect.height + 20,
      border: '2px solid #3B82F6',
      borderRadius: '8px',
      backgroundColor: 'transparent',
      zIndex: 9999,
      pointerEvents: 'none'
    };
  };

  const getTooltipStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'fixed',
      zIndex: 9999,
      backgroundColor: 'white',
      padding: '1rem',
      borderRadius: '0.5rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      maxWidth: '300px',
      pointerEvents: 'auto'
    };

    const padding = 16; // 1rem in pixels

    switch (currentTutorial.position) {
      case 'top':
        return {
          ...baseStyle,
          top: targetRect.top - 10 - padding,
          left: targetRect.left + targetRect.width / 2,
          transform: 'translate(-50%, -100%)'
        };
      case 'bottom':
        return {
          ...baseStyle,
          top: targetRect.bottom + 10,
          left: targetRect.left + targetRect.width / 2,
          transform: 'translateX(-50%)'
        };
      case 'left':
        return {
          ...baseStyle,
          top: targetRect.top + targetRect.height / 2,
          left: targetRect.left - 10,
          transform: 'translate(-100%, -50%)'
        };
      case 'right':
        return {
          ...baseStyle,
          top: targetRect.top + targetRect.height / 2,
          left: targetRect.right + 10,
          transform: 'translateY(-50%)'
        };
    }
  };

  return (
    <>
      <div style={getOverlayStyle()} onClick={handleSkip} />
      <div style={getHighlightStyle()} />
      <div
        className="dark:bg-gray-800 dark:text-white"
        style={getTooltipStyle()}
      >
        <h3 className="text-lg font-semibold mb-2">{currentTutorial.title}</h3>
        <p className="text-sm mb-4">{currentTutorial.content}</p>
        <div className="flex justify-between items-center">
          <button
            onClick={handleSkip}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Skip Tutorial
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {currentStep + 1} of {steps.length}
            </span>
            <button
              onClick={handleNext}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
