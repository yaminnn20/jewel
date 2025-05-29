import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import BaseDesignGallery from "@/components/base-design-gallery";
import DesignWorkspace from "@/components/design-workspace";
import ChatInterface from "@/components/chat-interface";
import LoadingOverlay from "@/components/loading-overlay";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { BaseDesign, SubDesign, DesignProject } from "@shared/schema";

export default function JewelryDesigner() {
  const [selectedBaseDesign, setSelectedBaseDesign] = useState<BaseDesign | null>(null);
  const [selectedSubDesigns, setSelectedSubDesigns] = useState<number[]>([]);
  const [currentProject, setCurrentProject] = useState<DesignProject | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch base designs
  const { data: baseDesigns = [], isLoading: loadingBaseDesigns } = useQuery({
    queryKey: ["/api/base-designs"],
  });

  // Fetch sub designs
  const { data: subDesigns = [], isLoading: loadingSubDesigns } = useQuery({
    queryKey: ["/api/sub-designs"],
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: api.createProject,
    onSuccess: (project) => {
      setCurrentProject(project);
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Project Created",
        description: "Your design project has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Generate design mutation
  const generateDesignMutation = useMutation({
    mutationFn: api.generateDesign,
    onSuccess: (response) => {
      if (currentProject) {
        const updatedIterations = [
          ...(currentProject.designIterations || []),
          response.iteration,
        ];
        
        const updatedProject = {
          ...currentProject,
          designIterations: updatedIterations,
          currentDesignData: {
            imageUrl: response.iteration.imageUrl,
            prompt: response.iteration.prompt,
            specifications: {},
          },
        };
        
        setCurrentProject(updatedProject);
        api.updateProject(currentProject.id, updatedProject);
      }
      
      toast({
        title: "Design Generated",
        description: "Your custom design has been generated successfully.",
      });
      setIsGenerating(false);
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate design. Please try again.",
        variant: "destructive",
      });
      setIsGenerating(false);
    },
  });

  // Export design mutation
  const exportDesignMutation = useMutation({
    mutationFn: api.exportDesign,
    onSuccess: () => {
      toast({
        title: "Export Successful",
        description: "Your design has been sent to manufacturing.",
      });
    },
    onError: () => {
      toast({
        title: "Export Failed",
        description: "Failed to export design. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSelectBaseDesign = async (design: BaseDesign) => {
    setSelectedBaseDesign(design);
    
    // Create new project if none exists
    if (!currentProject) {
      const projectData = {
        name: `Custom ${design.name}`,
        baseDesignId: design.id,
        currentDesignData: {
          imageUrl: design.imageUrl,
          prompt: `Base design: ${design.name}`,
          specifications: design.specifications || {},
        },
        chatHistory: [],
        designIterations: [],
        selectedSubDesigns: [],
        status: "draft",
      };
      
      createProjectMutation.mutate(projectData);
    }
  };

  const handleGenerateDesign = (prompt: string) => {
    if (!selectedBaseDesign) {
      toast({
        title: "No Base Design",
        description: "Please select a base design first.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    generateDesignMutation.mutate({
      prompt,
      baseDesignId: selectedBaseDesign.id,
    });
  };

  const handleExportDesign = () => {
    if (!currentProject) {
      toast({
        title: "No Project",
        description: "Please create a design project first.",
        variant: "destructive",
      });
      return;
    }

    exportDesignMutation.mutate(currentProject.id);
  };

  const handleSubDesignToggle = (subDesignId: number) => {
    setSelectedSubDesigns(prev => 
      prev.includes(subDesignId)
        ? prev.filter(id => id !== subDesignId)
        : [...prev, subDesignId]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[hsl(var(--luxury-gold))] to-[hsl(var(--amethyst))] rounded-lg flex items-center justify-center">
                <i className="fas fa-gem text-white text-lg"></i>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-[hsl(var(--navy))]">AI Jewelry Designer</h1>
                <p className="text-sm text-muted-foreground">Professional Design Studio</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <i className="fas fa-history mr-2"></i>
                History
              </Button>
              <Button variant="ghost" size="sm">
                <i className="fas fa-cog mr-2"></i>
                Settings
              </Button>
              <Button 
                onClick={handleExportDesign}
                disabled={!currentProject || exportDesignMutation.isPending}
                className="bg-[hsl(var(--luxury-gold))] hover:bg-[hsl(var(--luxury-gold))]/90 text-white"
              >
                <i className="fas fa-download mr-2"></i>
                Export Design
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Base Design Gallery */}
          <div className="lg:col-span-1">
            <BaseDesignGallery
              baseDesigns={baseDesigns}
              subDesigns={subDesigns}
              selectedBaseDesign={selectedBaseDesign}
              selectedSubDesigns={selectedSubDesigns}
              onSelectBaseDesign={handleSelectBaseDesign}
              onToggleSubDesign={handleSubDesignToggle}
              isLoading={loadingBaseDesigns || loadingSubDesigns}
            />
          </div>

          {/* Design Workspace */}
          <div className="lg:col-span-1">
            <DesignWorkspace
              currentProject={currentProject}
              selectedBaseDesign={selectedBaseDesign}
              onGenerateDesign={handleGenerateDesign}
              onExportDesign={handleExportDesign}
              isGenerating={isGenerating}
            />
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-1">
            <ChatInterface
              currentProject={currentProject}
              onGenerateDesign={handleGenerateDesign}
              isGenerating={isGenerating}
            />
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      <LoadingOverlay 
        isVisible={isGenerating || createProjectMutation.isPending} 
        message="Generating your custom design..."
      />
    </div>
  );
}
