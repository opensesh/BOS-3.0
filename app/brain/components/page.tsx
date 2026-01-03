'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { MainContent } from '@/components/MainContent';
import { ComponentsDrawer } from '@/components/docs/ComponentsDrawer';
import { ComponentPreview } from '@/components/docs/ComponentPreview';
import { ComponentsList } from '@/components/docs/ComponentsList';
import { PageTransition, MotionItem } from '@/lib/motion';
import { Loader2, LayoutList, PanelRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getComponentById, getAllComponents, ComponentDoc } from '@/lib/component-registry';

function ComponentsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedComponent, setSelectedComponent] = useState<ComponentDoc | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string>('default');

  // Get component from URL params
  const componentIdFromUrl = searchParams.get('component');
  const variantIdFromUrl = searchParams.get('variant');

  // Show list view when no component is selected in URL
  const showListView = !componentIdFromUrl;

  // Initialize from URL params
  useEffect(() => {
    if (componentIdFromUrl) {
      const component = getComponentById(componentIdFromUrl);
      if (component) {
        setSelectedComponent(component);
        setSelectedVariant(variantIdFromUrl || 'default');
      }
    } else {
      // No component in URL - show list view, but preselect first component for when user switches
      const allComponents = getAllComponents();
      if (allComponents.length > 0) {
        setSelectedComponent(allComponents[0]);
        setSelectedVariant('default');
      }
    }
  }, [componentIdFromUrl, variantIdFromUrl]);

  const handleSelectComponent = (componentId: string) => {
    const component = getComponentById(componentId);
    if (component) {
      setSelectedComponent(component);
      setSelectedVariant('default');
      
      // Update URL
      const params = new URLSearchParams();
      params.set('component', componentId);
      router.push(`/brain/components?${params.toString()}`);
    }
  };

  const handleVariantChange = (variantId: string) => {
    setSelectedVariant(variantId);
    
    // Update URL
    if (selectedComponent) {
      const params = new URLSearchParams();
      params.set('component', selectedComponent.id);
      if (variantId !== 'default') {
        params.set('variant', variantId);
      }
      router.push(`/brain/components?${params.toString()}`);
    }
  };

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--fg-primary)] font-sans">
      <Sidebar />
      
      {/* Component Navigation Drawer */}
      <ComponentsDrawer
        isOpen={isDrawerOpen}
        onToggle={() => setIsDrawerOpen(!isDrawerOpen)}
        selectedComponentId={selectedComponent?.id}
        onSelectComponent={(componentId) => {
          // Navigate to the component preview
          const component = getComponentById(componentId);
          if (component) {
            setSelectedComponent(component);
            setSelectedVariant('default');
          }
          // Update URL to show the component
          const params = new URLSearchParams();
          params.set('component', componentId);
          router.push(`/brain/components?${params.toString()}`);
          // Close drawer after selection
          setIsDrawerOpen(false);
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      
      {/* Main Content */}
      <MainContent className="overflow-y-auto custom-scrollbar">
        <PageTransition className="w-full max-w-6xl mx-auto px-6 py-8 md:px-12 md:py-12">
          {/* Page Header */}
          <MotionItem className="flex flex-col gap-2 mb-10">
            <div className="flex items-center justify-between">
              <h1 className="text-4xl md:text-5xl font-display font-bold text-[var(--fg-primary)] leading-tight">
                {showListView ? 'All Components' : (selectedComponent?.name || 'Components')}
              </h1>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {/* All Components Button */}
                <Link
                  href="/brain/components"
                  className={cn(
                    "group relative p-3 rounded-xl border transition-colors",
                    showListView 
                      ? "bg-[var(--bg-brand-primary)] border-[var(--border-brand)] text-[var(--fg-brand-primary)]" 
                      : "bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border-[var(--border-primary)] text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]"
                  )}
                  title="All Components"
                >
                  <LayoutList className="w-5 h-5 transition-colors" />
                </Link>
                
                {/* Show Components Drawer Button */}
                <button
                  onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                  className={cn(
                    "group relative p-3 rounded-xl border transition-colors",
                    isDrawerOpen 
                      ? "bg-[var(--bg-brand-primary)] border-[var(--border-brand)] text-[var(--fg-brand-primary)]" 
                      : "bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border-[var(--border-primary)] text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]"
                  )}
                  title="Show Components"
                >
                  <PanelRight className="w-5 h-5 transition-colors" />
                </button>
              </div>
            </div>
            <p className="text-base md:text-lg text-[var(--fg-tertiary)] max-w-2xl">
              {showListView 
                ? 'Browse all registered components with metadata including creation date, category, and usage statistics.'
                : (selectedComponent?.description || 'Interactive component documentation and live preview. Select a component from the drawer to explore its props and variants.')}
            </p>
          </MotionItem>

          {/* Content - List View or Component Preview */}
          <MotionItem>
            {showListView ? (
              <ComponentsList 
                onSelectComponent={(componentId) => {
                  // Navigate to component preview
                  const params = new URLSearchParams();
                  params.set('component', componentId);
                  router.push(`/brain/components?${params.toString()}`);
                  
                  // Also update local state
                  const component = getComponentById(componentId);
                  if (component) {
                    setSelectedComponent(component);
                    setSelectedVariant('default');
                  }
                }}
                onClose={() => {
                  // If there's a selected component, navigate to it
                  if (selectedComponent) {
                    router.push(`/brain/components?component=${selectedComponent.id}`);
                  }
                }}
              />
            ) : (
              <ComponentPreview
                component={selectedComponent}
                selectedVariant={selectedVariant}
                onVariantChange={handleVariantChange}
              />
            )}
          </MotionItem>
        </PageTransition>
      </MainContent>
    </div>
  );
}

export default function ComponentsPage() {
  return (
    <Suspense 
      fallback={
        <div className="flex h-screen items-center justify-center bg-[var(--bg-primary)] text-[var(--fg-primary)]">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--fg-brand-primary)]" />
        </div>
      }
    >
      <ComponentsContent />
    </Suspense>
  );
}
