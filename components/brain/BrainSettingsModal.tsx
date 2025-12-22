'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { X, Upload, FileText, CheckCircle2, BookOpen, PenTool, Check, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui';

export type BrainSection = 'architecture' | 'guidelines' | 'writing' | 'skills';

interface BrainSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSection?: BrainSection;
}

interface UploadedFile {
  id: string;
  name: string;
  type: 'guidelines' | 'writing';
  status: 'uploading' | 'complete';
}

type SelectedOption = 'guidelines' | 'writing' | 'skills' | null;

export function BrainSettingsModal({ isOpen, onClose, defaultSection }: BrainSettingsModalProps) {
  const [selectedOption, setSelectedOption] = useState<SelectedOption>(null);
  const [skillDescription, setSkillDescription] = useState('');
  
  useEffect(() => {
    if (isOpen) {
      if (defaultSection === 'guidelines' || defaultSection === 'writing' || defaultSection === 'skills') {
        setSelectedOption(defaultSection);
      } else {
        setSelectedOption(null);
      }
    }
  }, [isOpen, defaultSection]);

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent, type: 'guidelines' | 'writing') => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      const newFile: UploadedFile = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type,
        status: 'complete',
      };
      setUploadedFiles(prev => [...prev, newFile]);
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>, type: 'guidelines' | 'writing') => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const newFile: UploadedFile = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type,
        status: 'complete',
      };
      setUploadedFiles(prev => [...prev, newFile]);
    });
  }, []);

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const getFilesForType = (type: 'guidelines' | 'writing') => {
    return uploadedFiles.filter(f => f.type === type);
  };

  if (!isOpen) return null;

  const options = [
    {
      id: 'guidelines' as const,
      title: 'Brand Guidelines',
      description: 'Upload your brand identity documentation',
      icon: BookOpen,
    },
    {
      id: 'writing' as const,
      title: 'Writing Styles',
      description: 'Upload your voice and tone guidelines',
      icon: PenTool,
    },
    {
      id: 'skills' as const,
      title: 'Skills',
      description: 'Create custom AI capabilities',
      icon: Zap,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[var(--bg-overlay)]"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[var(--bg-primary)] border border-[var(--border-secondary)] rounded-2xl shadow-[var(--shadow-xl)] m-4">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-[var(--border-secondary)] bg-[var(--bg-primary)] z-10">
          <div>
            <h2 className="text-xl font-display font-bold text-[var(--fg-primary)]">
              Brain Settings
            </h2>
            <p className="text-sm text-[var(--fg-tertiary)]">
              Configure your brand knowledge base
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
          >
            <X className="w-5 h-5 text-[var(--fg-tertiary)]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Option Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {options.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedOption === option.id;
              
              return (
                <button
                  key={option.id}
                  onClick={() => setSelectedOption(option.id)}
                  className={`
                    relative p-4 rounded-xl border text-left transition-all cursor-pointer
                    ${isSelected
                      ? 'bg-[var(--bg-brand-primary)] border-[var(--border-brand-solid)]'
                      : 'bg-[var(--bg-secondary)] border-[var(--border-secondary)] hover:border-[var(--border-primary)]'
                    }
                  `}
                >
                  {isSelected && (
                    <span className="absolute top-2 right-2 p-1 bg-[var(--bg-brand-solid)] rounded-full">
                      <Check className="w-3 h-3 text-white" />
                    </span>
                  )}
                  
                  <div className="p-2 rounded-lg bg-[var(--bg-brand-primary)] w-fit mb-3">
                    <Icon className="w-5 h-5 text-[var(--fg-brand-primary)]" />
                  </div>
                  <h3 className="font-display font-medium text-[var(--fg-primary)] mb-1">
                    {option.title}
                  </h3>
                  <p className="text-xs text-[var(--fg-tertiary)]">
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Upload Section */}
          {(selectedOption === 'guidelines' || selectedOption === 'writing') && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-[var(--fg-brand-primary)]" />
                <h3 className="text-lg font-display font-medium text-[var(--fg-primary)]">
                  Upload {selectedOption === 'guidelines' ? 'Brand Guidelines' : 'Writing Styles'}
                </h3>
              </div>
              
              <p className="text-sm text-[var(--fg-tertiary)]">
                {selectedOption === 'guidelines' 
                  ? 'We recommend uploading your brand guidelines as a PPTX or PDF file.'
                  : 'Upload your writing style guides as PPTX, PDF, or DOCX files.'
                }
              </p>
              
              {/* Drop Zone */}
              <div
                onDrop={(e) => handleDrop(e, selectedOption)}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer p-8
                  ${isDragging 
                    ? 'border-[var(--border-brand-solid)] bg-[var(--bg-brand-primary)]' 
                    : 'border-[var(--border-secondary)] hover:border-[var(--border-primary)] hover:bg-[var(--bg-secondary)]'
                  }
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={selectedOption === 'guidelines' ? '.pptx,.pdf' : '.pptx,.pdf,.docx'}
                  multiple
                  onChange={(e) => handleFileSelect(e, selectedOption)}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className={`p-3 rounded-full transition-colors ${
                    isDragging ? 'bg-[var(--bg-brand-secondary)]' : 'bg-[var(--bg-tertiary)]'
                  }`}>
                    <Upload className={`w-6 h-6 ${
                      isDragging ? 'text-[var(--fg-brand-primary)]' : 'text-[var(--fg-tertiary)]'
                    }`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--fg-primary)]">
                      Drop files here or click to upload
                    </p>
                    <p className="text-xs text-[var(--fg-tertiary)] mt-1">
                      {selectedOption === 'guidelines' 
                        ? 'PPTX, PDF up to 50MB'
                        : 'PPTX, PDF, DOCX up to 50MB'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Uploaded Files */}
              {getFilesForType(selectedOption).length > 0 && (
                <div className="space-y-2">
                  {getFilesForType(selectedOption).map(file => (
                    <div 
                      key={file.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-secondary)]"
                    >
                      <FileText className="w-5 h-5 text-[var(--fg-brand-primary)]" />
                      <span className="flex-1 text-sm text-[var(--fg-primary)] truncate">
                        {file.name}
                      </span>
                      <CheckCircle2 className="w-5 h-5 text-[var(--fg-success-primary)]" />
                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-1 rounded hover:bg-[var(--bg-tertiary)] transition-colors"
                      >
                        <X className="w-4 h-4 text-[var(--fg-tertiary)]" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Skills Description Section */}
          {selectedOption === 'skills' && (
            <section className="space-y-4">
              <h3 className="text-lg font-display font-medium text-[var(--fg-primary)]">
                Create a Skill
              </h3>
              
              <p className="text-sm text-[var(--fg-tertiary)]">
                Describe the capability you want to add to your brand operating system.
              </p>
              
              <textarea
                value={skillDescription}
                onChange={(e) => setSkillDescription(e.target.value)}
                placeholder="Describe the skill you want to create in your brand operating system..."
                className="w-full h-40 p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-secondary)] text-[var(--fg-primary)] placeholder:text-[var(--fg-placeholder)] focus:outline-none focus:border-[var(--border-brand-solid)] focus:ring-1 focus:ring-[var(--focus-ring)] resize-none transition-colors"
              />
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-3 p-6 border-t border-[var(--border-secondary)] bg-[var(--bg-primary)]">
          <Button
            type="button"
            color="tertiary"
            size="md"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            color="primary"
            size="md"
            onClick={onClose}
            iconTrailing={ArrowRight}
          >
            Continue to Interview
          </Button>
        </div>
      </div>
    </div>
  );
}
