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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/swarm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create swarm');
      }

      onCreated();
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An error occurred while creating the swarm');
      }
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
            {isSubmitting ? 'Creating...' : 'Create Swarm'}
          </Button>
        </div>
      </form>
    </div>
  );
}
