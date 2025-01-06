import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AssistantIcon } from '~/components/svg';

import { promptCategories } from '../Prompts/promptsData';

export default function PromptsNav() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategory(categoryName === selectedCategory ? null : categoryName);
  };

  return (
    <div className="flex flex-col space-y-2 px-2" data-tutorial="prompts-library">
      <div className="flex items-center px-2 py-3">
        <AssistantIcon className="mr-2 h-4 w-4" />
        <span className="text-lg font-semibold">Prompt Library</span>
      </div>

      {promptCategories.map((category) => (
        <div key={category.name} className="rounded-lg bg-surface-secondary" data-tutorial="prompts-category">
          <button
            className="flex w-full items-center justify-between p-3 text-left hover:bg-hover"
            onClick={() => handleCategoryClick(category.name)}
          >
            <span className="font-medium">{category.name}</span>
            <span className="text-xs text-gray-500">{category.prompts.length} prompts</span>
          </button>

          {selectedCategory === category.name && (
            <div className="p-3 pt-0">
              <p className="mb-2 text-sm text-gray-500">{category.description}</p>
              <div className="space-y-2">
                {category.prompts.map((prompt) => (
                  <button
                    key={prompt.title}
                    className="w-full rounded-md bg-surface-primary p-2 text-left text-sm hover:bg-hover"
                    data-tutorial="prompt-template"
                    onClick={() => {
                      navigate('/c/new', {
                        state: { prompt: prompt.content }
                      });
                    }}
                  >
                    <div className="font-medium">{prompt.title}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {prompt.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
