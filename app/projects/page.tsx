'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, Plus, ArrowUpDown, X, Folder } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { MainContent } from '@/components/MainContent';
import { useBreadcrumbs } from '@/lib/breadcrumb-context';
import { projectsService, type Project } from '@/lib/supabase/projects-service';
import { ProjectCard, NewProjectModal } from '@/components/projects';

type SortField = 'name' | 'updated_at' | 'created_at';
type SortDirection = 'asc' | 'desc';

// Header component consistent with Recent Chats page
function ProjectsPageHeader() {
  return (
    <div className="sticky top-0 z-30 bg-[var(--bg-primary)] border-b border-[var(--border-secondary)]">
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        <div className="flex items-center h-12">
          <span className="text-sm font-medium text-[var(--fg-primary)]">Projects</span>
        </div>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const router = useRouter();
  const { setBreadcrumbs } = useBreadcrumbs();

  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [chatCounts, setChatCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('updated_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Set breadcrumbs on mount
  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', href: '/' },
      { label: 'Projects' },
    ]);
  }, [setBreadcrumbs]);

  // Load projects
  useEffect(() => {
    async function loadProjects() {
      setIsLoading(true);
      try {
        const [loadedProjects, counts] = await Promise.all([
          projectsService.getProjects(),
          projectsService.getProjectChatCounts(),
        ]);
        setProjects(loadedProjects);
        setChatCounts(counts);
      } catch (error) {
        console.error('Error loading projects:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadProjects();
  }, []);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (project) =>
          project.name.toLowerCase().includes(query) ||
          project.description?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'updated_at') {
        comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
      } else if (sortField === 'created_at') {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [projects, searchQuery, sortField, sortDirection]);

  const handleCreateProject = async (name: string, description: string, color: string) => {
    const newProject = await projectsService.createProject({
      name,
      description,
      color,
    });
    if (newProject) {
      setProjects((prev) => [newProject, ...prev]);
      // Navigate to the new project
      router.push(`/projects/${newProject.id}`);
    }
  };

  const handleSortChange = () => {
    // Cycle through sort options
    if (sortField === 'updated_at' && sortDirection === 'desc') {
      setSortField('name');
      setSortDirection('asc');
    } else if (sortField === 'name' && sortDirection === 'asc') {
      setSortField('created_at');
      setSortDirection('desc');
    } else {
      setSortField('updated_at');
      setSortDirection('desc');
    }
  };

  const getSortLabel = () => {
    if (sortField === 'name') return 'Name';
    if (sortField === 'created_at') return 'Created';
    return 'Activity';
  };

  return (
    <div className="flex h-screen bg-[var(--bg-primary)]">
      <Sidebar />
      <MainContent className="overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <ProjectsPageHeader />

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
              {/* Project count and sort row */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-[var(--fg-tertiary)]">
                  {projects.length} project{projects.length !== 1 ? 's' : ''}
                </p>
                <button
                  onClick={handleSortChange}
                  className="
                    flex items-center gap-2
                    px-3 py-1.5
                    text-sm text-[var(--fg-secondary)]
                    hover:text-[var(--fg-primary)]
                    hover:bg-[var(--bg-secondary)]
                    rounded-lg
                    transition-colors
                  "
                >
                  <span>Sort by</span>
                  <span className="font-medium text-[var(--fg-primary)]">{getSortLabel()}</span>
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Search - Full Width */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fg-quaternary)]" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="
                    w-full pl-10 pr-4 py-2.5
                    bg-[var(--bg-secondary)]
                    border border-[var(--border-secondary)]
                    rounded-lg
                    text-sm text-[var(--fg-primary)]
                    placeholder:text-[var(--fg-quaternary)]
                    focus:outline-none focus:ring-2 focus:ring-[var(--fg-brand-primary)]/20 focus:border-[var(--fg-brand-primary)]
                    transition-all
                  "
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--fg-quaternary)] hover:text-[var(--fg-primary)]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Projects Grid */}
              {isLoading ? (
                // Loading skeleton
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="
                        bg-[var(--bg-secondary)]
                        border border-[var(--border-secondary)]
                        rounded-xl
                        p-5
                        animate-pulse
                      "
                    >
                      <div className="h-5 w-32 bg-[var(--bg-tertiary)] rounded mb-4" />
                      <div className="space-y-2">
                        <div className="h-4 w-full bg-[var(--bg-tertiary)] rounded" />
                        <div className="h-4 w-3/4 bg-[var(--bg-tertiary)] rounded" />
                      </div>
                      <div className="h-3 w-24 bg-[var(--bg-tertiary)] rounded mt-4" />
                    </div>
                  ))}
                </div>
              ) : filteredProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProjects.map((project, index) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      chatCount={chatCounts[project.id] || 0}
                      index={index}
                    />
                  ))}
                </div>
              ) : (
                // Empty State
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-16 px-4"
                >
                  <div className="
                    w-16 h-16 mb-4
                    rounded-full
                    bg-[var(--bg-secondary)]
                    border border-[var(--border-secondary)]
                    flex items-center justify-center
                  ">
                    <Folder className="w-7 h-7 text-[var(--fg-quaternary)]" />
                  </div>
                  {searchQuery ? (
                    <>
                      <h3 className="text-lg font-semibold text-[var(--fg-primary)] mb-1">
                        No results found
                      </h3>
                      <p className="text-sm text-[var(--fg-tertiary)] text-center max-w-[280px] mb-4">
                        Try adjusting your search to find what you&apos;re looking for.
                      </p>
                      <button
                        onClick={() => setSearchQuery('')}
                        className="text-sm text-[var(--fg-brand-primary)] hover:underline"
                      >
                        Clear search
                      </button>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold text-[var(--fg-primary)] mb-1">
                        No projects yet
                      </h3>
                      <p className="text-sm text-[var(--fg-tertiary)] text-center max-w-[280px] mb-4">
                        Create a project to organize your conversations.
                      </p>
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="
                          flex items-center gap-2
                          px-4 py-2
                          bg-[var(--bg-brand-solid)]
                          text-white
                          rounded-lg font-medium text-sm
                          hover:bg-[var(--bg-brand-solid)]/90
                          transition-colors
                        "
                      >
                        <Plus className="w-4 h-4" />
                        <span>Create a project</span>
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </MainContent>

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateProject}
      />
    </div>
  );
}

