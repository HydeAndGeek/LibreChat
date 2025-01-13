import { useState } from 'react';
import { Button, Input, Textarea } from '~/components/ui';
import { useAuthContext } from '~/hooks/AuthContext';

interface SwarmCreateProps {
  onCreated: () => void;
  onCancel: () => void;
}

export default function SwarmCreate({ onCreated, onCancel }: SwarmCreateProps) {
  const { token } = useAuthContext();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    project: {
      name: '',
      requirements: ''
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;
  const timeoutDuration = 45000; // 45 second timeout

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const attemptSubmit = async (attempt: number): Promise<void> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

      try {
        const response = await fetch('/api/swarm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(
            data.message ||
            `Failed to create swarm (${response.status}: ${response.statusText})`
          );
        }

        const data = await response.json();
        if (data.swarm) {
          onCreated();
        } else {
          throw new Error('Invalid server response');
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            if (attempt < maxRetries) {
              setError(`Request timed out. Retrying... (Attempt ${attempt + 1}/${maxRetries + 1})`);
              setRetryCount(attempt + 1);
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
              return attemptSubmit(attempt + 1);
            } else {
              setError('Request timed out. The swarm may still be creating in the background. Please check the swarm list in a few moments.');
            }
          } else {
            setError(`Error: ${error.message}`);
          }
        } else {
          setError('An unexpected error occurred while creating the swarm');
        }
        console.error('Swarm creation error:', error);
        throw error; // Propagate error to outer catch
      }
    };

    try {
      await attemptSubmit(retryCount);
    } catch (error) {
      // Final error already set by inner catch
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6" data-tutorial="swarm-agents">
        <h2 className="text-2xl font-bold mb-4">Create New AI Agent Swarm</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Create a new swarm of AI agents to work on your project. The swarm will include
          specialized agents for product management, architecture, development, and testing.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Swarm Name
          </label>
          <Input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter a name for your swarm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Description
          </label>
          <Textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the purpose of this swarm"
            rows={3}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Project Name
          </label>
          <Input
            name="project.name"
            value={formData.project.name}
            onChange={handleChange}
            placeholder="Enter your project name"
            required
          />
        </div>

        <div data-tutorial="swarm-requirements">
          <label className="block text-sm font-medium mb-2">
            Project Requirements
          </label>
          <Textarea
            name="project.requirements"
            value={formData.project.requirements}
            onChange={handleChange}
            placeholder="Describe your project requirements in detail"
            rows={5}
            required
          />
        </div>

        {error && (
          <div className="text-red-500 text-sm p-2 bg-red-50 dark:bg-red-900/50 rounded">
            {error}
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            onClick={onCancel}
            className="bg-gray-500 hover:bg-gray-600 text-white"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Swarm...
              </div>
            ) : (
              'Create Swarm'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
