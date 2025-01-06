export interface TutorialStep {
  target: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

export interface TutorialProps {
  steps?: TutorialStep[];
  onComplete?: () => void;
  onSkip?: () => void;
}

export interface TutorialState {
  currentStep: number;
  isVisible: boolean;
  hasSeenTutorial: boolean;
}
