'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { MainContent } from '@/components/MainContent';
import { useBreadcrumbs } from '@/lib/breadcrumb-context';
import {
  projectsService,
  type ProjectWithDetails,
} from '@/lib/supabase/projects-service';
import {
  ProjectHeader,
  ProjectChatList,
  ProjectSidebar,
} from '@/components/projects';
import { ProjectChatInput } from '@/components/projects/ProjectChatList';
import { Loader2 } from 'lucide-react';

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { setBreadcrumbs } = useBreadcrumbs();

  // State
  const [project, setProject] = useState<ProjectWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalFileSize, setTotalFileSize] = useState(0);

  // Load project with all details
  const loadProject = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await projectsService.getProjectWithDetails(projectId);
      if (!data) {
        setError('Project not found');
        return;
      }
      setProject(data);

      // Calculate total file size
      const size = await projectsService.getProjectFileSize(projectId);
      setTotalFileSize(size);

      // Update breadcrumbs
      setBreadcrumbs([
        { label: 'Home', href: '/' },
        { label: 'Projects', href: '/projects' },
        { label: data.name },
      ]);
    } catch (err) {
      console.error('Error loading project:', err);
      setError('Failed to load project');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, setBreadcrumbs]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  // Handlers
  const handleUpdateProject = async (updates: { name?: string; description?: string }) => {
    if (!project) return;
    const updated = await projectsService.updateProject(projectId, updates);
    if (updated) {
      setProject((prev) => (prev ? { ...prev, ...updated } : null));
      // Update breadcrumbs if name changed
      if (updates.name) {
        setBreadcrumbs([
          { label: 'Home', href: '/' },
          { label: 'Projects', href: '/projects' },
          { label: updates.name },
        ]);
      }
    }
  };

  const handleDeleteProject = async () => {
    const success = await projectsService.deleteProject(projectId);
    if (success) {
      router.push('/projects');
    }
  };

  const handleSaveInstructions = async (content: string) => {
    await projectsService.saveProjectInstructions(projectId, content);
    // Reload to get updated instructions
    const data = await projectsService.getProjectWithDetails(projectId);
    if (data) {
      setProject(data);
    }
  };

  const handleUploadFile = async (file: File) => {
    const uploaded = await projectsService.uploadProjectFile(projectId, file);
    if (uploaded && project) {
      setProject((prev) =>
        prev
          ? {
              ...prev,
              files: [uploaded, ...prev.files],
            }
          : null
      );
      // Update total size
      setTotalFileSize((prev) => prev + (file.size || 0));
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    const file = project?.files.find((f) => f.id === fileId);
    const success = await projectsService.deleteProjectFile(fileId);
    if (success && project) {
      setProject((prev) =>
        prev
          ? {
              ...prev,
              files: prev.files.filter((f) => f.id !== fileId),
            }
          : null
      );
      // Update total size
      if (file?.file_size) {
        setTotalFileSize((prev) => Math.max(0, prev - file.file_size!));
      }
    }
  };

  const handleRemoveChatFromProject = async (chatId: string) => {
    const success = await projectsService.assignChatToProject(chatId, null);
    if (success && project) {
      setProject((prev) =>
        prev
          ? {
              ...prev,
              chats: prev.chats.filter((c) => c.id !== chatId),
              chat_count: prev.chat_count - 1,
            }
          : null
      );
    }
  };

  const handleNewChat = (query: string) => {
    // TODO: Create new chat and assign to this project
    // For now, navigate to home with the query
    router.push(`/?q=${encodeURIComponent(query)}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen bg-[var(--bg-primary)]">
        <Sidebar />
        <MainContent className="flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-[var(--fg-brand-primary)] animate-spin" />
            <p className="text-sm text-[var(--fg-tertiary)]">Loading project...</p>
          </div>
        </MainContent>
      </div>
    );
  }

  // Error state
  if (error || !project) {
    return (
      <div className="flex h-screen bg-[var(--bg-primary)]">
        <Sidebar />
        <MainContent className="flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-[var(--fg-primary)] mb-2">
              {error || 'Project not found'}
            </h2>
            <button
              onClick={() => router.push('/projects')}
              className="text-sm text-[var(--fg-brand-primary)] hover:underline"
            >
              Back to projects
            </button>
          </div>
        </MainContent>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[var(--bg-primary)]">
      <Sidebar />
      <MainContent className="overflow-hidden">
        <div className="flex flex-col lg:flex-row h-full">
          {/* Main content area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
                {/* Project Header */}
                <ProjectHeader
                  project={project}
                  onUpdate={handleUpdateProject}
                  onDelete={handleDeleteProject}
                />

                {/* Chat Input */}
                <div className="mb-6">
                  <ProjectChatInput
                    projectId={projectId}
                    onSubmit={handleNewChat}
                  />
                </div>

                {/* Conversations List */}
                <div className="
                  bg-[var(--bg-secondary)]
                  border border-[var(--border-secondary)]
                  rounded-xl
                  overflow-hidden
                ">
                  <ProjectChatList
                    chats={project.chats}
                    projectId={projectId}
                    onRemoveChat={handleRemoveChatFromProject}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Instructions & Files */}
          <ProjectSidebar
            projectId={projectId}
            projectName={project.name}
            instructions={project.instructions}
            files={project.files}
            totalFileSize={totalFileSize}
            onSaveInstructions={handleSaveInstructions}
            onUploadFile={handleUploadFile}
            onDeleteFile={handleDeleteFile}
          />
        </div>
      </MainContent>
    </div>
  );
}

