import { useNavigate } from 'react-router-dom';
import { AssistantIcon } from '~/components/svg';

interface SwarmNavProps {
  isSmallScreen?: boolean;
}

export default function SwarmNav({ isSmallScreen }: SwarmNavProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/swarm');
  };

  return (
    <div className="relative flex items-center">
      <button
        data-tutorial="swarm-nav"
        className="flex w-full flex-row items-center gap-3 rounded-lg p-3 text-sm transition-colors duration-200 hover:bg-hover"
        onClick={handleClick}
      >
        <AssistantIcon className="h-4 w-4" />
        <span className="text-text-primary">AI Agent Swarms</span>
      </button>
    </div>
  );
}
