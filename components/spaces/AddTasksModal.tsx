'use client';

import { useState, useRef } from 'react';
import { Modal, Button } from '@/components/ui';
import { Plus, X, Square, CheckSquare, User } from 'lucide-react';
import { SpaceTask } from '@/types';

interface AddTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: Omit<SpaceTask, 'id' | 'createdAt' | 'completed'>) => void;
  existingTasks?: SpaceTask[];
  onToggleTask?: (taskId: string) => void;
  onRemoveTask?: (taskId: string) => void;
}

export function AddTasksModal({
  isOpen,
  onClose,
  onAddTask,
  existingTasks = [],
  onToggleTask,
  onRemoveTask,
}: AddTasksModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Modal component handles auto-focus on first input

  const handleAddTask = () => {
    if (!title.trim()) return;

    onAddTask({
      title: title.trim(),
      description: description.trim() || undefined,
      assignee: assignee.trim() || undefined,
    });

    // Reset form and refocus for adding more tasks
    setTitle('');
    setDescription('');
    setAssignee('');
    titleInputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && title.trim()) {
      e.preventDefault();
      handleAddTask();
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setAssignee('');
    onClose();
  };

  const completedCount = existingTasks.filter((t) => t.completed).length;
  const totalCount = existingTasks.length;

  // Common input styles
  const inputStyles = `
    w-full px-3 py-2.5 rounded-xl
    bg-[var(--bg-primary_alt)] border border-[var(--border-primary)]
    text-[var(--fg-primary)] placeholder:text-[var(--fg-placeholder)]
    focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-transparent
    transition-colors
  `;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Tasks" size="md">
      {/* Add new task form */}
      <div className="space-y-4">
        <div>
          <label 
            htmlFor="task-title"
            className="block text-sm font-medium text-[var(--fg-primary)] mb-1.5"
          >
            Task title
          </label>
          <input
            ref={titleInputRef}
            id="task-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What needs to be done?"
            autoComplete="off"
            className={inputStyles}
          />
        </div>

        <div>
          <label 
            htmlFor="task-description"
            className="block text-sm font-medium text-[var(--fg-primary)] mb-1.5"
          >
            Description
          </label>
          <textarea
            id="task-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add more details (optional)"
            rows={2}
            className={`${inputStyles} resize-none`}
          />
        </div>

        <div>
          <label 
            htmlFor="task-assignee"
            className="block text-sm font-medium text-[var(--fg-primary)] mb-1.5"
          >
            Assignee
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fg-tertiary)]" />
            <input
              id="task-assignee"
              type="text"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="Assign to someone (optional)"
              autoComplete="off"
              className={`${inputStyles} pl-10`}
            />
          </div>
        </div>
      </div>

      {/* Existing tasks */}
      {existingTasks.length > 0 && (
        <div className="mt-6 pt-4 border-t border-[var(--border-secondary)]">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-[var(--fg-primary)]">
              Tasks ({totalCount})
            </h4>
            <span className="text-xs text-[var(--fg-tertiary)]">
              {completedCount} of {totalCount} completed
            </span>
          </div>

          {/* Progress bar */}
          {totalCount > 0 && (
            <div 
              className="h-1.5 bg-[var(--bg-tertiary)] rounded-full mb-4 overflow-hidden"
              role="progressbar"
              aria-valuenow={completedCount}
              aria-valuemin={0}
              aria-valuemax={totalCount}
              aria-label={`${completedCount} of ${totalCount} tasks completed`}
            >
              <div
                className="h-full bg-[var(--bg-brand-solid)] transition-all duration-300 ease-out"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
          )}

          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
            {existingTasks.map((task) => (
              <div
                key={task.id}
                className={`
                  flex items-start gap-3 p-3 rounded-xl transition-all duration-200
                  ${task.completed 
                    ? 'bg-[var(--bg-secondary)]' 
                    : 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)]'
                  }
                `}
              >
                <button
                  type="button"
                  onClick={() => onToggleTask?.(task.id)}
                  disabled={!onToggleTask}
                  className="mt-0.5 flex-shrink-0 text-[var(--fg-tertiary)] hover:text-[var(--fg-brand-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={task.completed ? `Mark "${task.title}" as incomplete` : `Mark "${task.title}" as complete`}
                >
                  {task.completed ? (
                    <CheckSquare className="w-5 h-5 text-[var(--fg-brand-primary)]" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm transition-colors ${
                      task.completed
                        ? 'text-[var(--fg-tertiary)] line-through'
                        : 'text-[var(--fg-primary)]'
                    }`}
                  >
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-xs text-[var(--fg-tertiary)] mt-1 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  {task.assignee && (
                    <div className="flex items-center gap-1 mt-1.5">
                      <User className="w-3 h-3 text-[var(--fg-tertiary)]" />
                      <span className="text-xs text-[var(--fg-tertiary)]">{task.assignee}</span>
                    </div>
                  )}
                </div>
                {onRemoveTask && (
                  <button
                    type="button"
                    onClick={() => onRemoveTask(task.id)}
                    className="p-1.5 rounded-lg hover:bg-[var(--bg-error-primary)] text-[var(--fg-tertiary)] hover:text-[var(--fg-error-primary)] transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring-error)]"
                    aria-label={`Remove task "${task.title}"`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer with action buttons */}
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--border-secondary)]">
        <Button
          type="button"
          color="secondary"
          size="md"
          onClick={handleClose}
        >
          Cancel
        </Button>
        <Button
          type="button"
          color="primary"
          size="md"
          onClick={handleAddTask}
          iconLeading={Plus}
        >
          Add Task
        </Button>
      </div>
    </Modal>
  );
}
