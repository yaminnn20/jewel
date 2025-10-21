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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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

  // Create new project mutation
  const createProjectMutation = useMutation({
    mutationFn: api.createProject,
    onSuccess: (response) => {
      if (response.success && response.project) {
        setCurrentProject(response.project);
      }
      toast({
        title: "Project Created",
        description: "New design project has been created.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
    onError: () => {
      toast({
        title: "Project Creation Failed",
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
    setIsSidebarOpen(false); // Close sidebar when design is selected

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

    // Get the current image URL for iteration
    const currentImageUrl = currentProject?.currentDesignData?.imageUrl || selectedBaseDesign.imageUrl;

    setIsGenerating(true);
    generateDesignMutation.mutate({
      prompt,
      baseDesignId: selectedBaseDesign.id,
      previousImage: currentImageUrl, // Pass current image for iteration
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
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <header className="bg-white border-b border-[#e5e7eb] shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-[#f3e9e0] rounded-xl flex items-center justify-center shadow-md">
                <i className="fas fa-gem text-[#a78bfa] text-2xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-[#2d224c] tracking-tight">AI Jewelry Designer</h1>
                <p className="text-sm text-[#7c6f98] font-medium">Professional Design Studio</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="hover:bg-[#f3e9e0] transition fixed md:relative left-4 top-20 md:top-0 z-50 bg-white shadow-md rounded-full p-2"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <i className={`fas ${isSidebarOpen ? 'fa-chevron-left' : 'fa-chevron-right'} text-[#2d224c]`}></i>
              </Button>
              <Button variant="ghost" size="sm" className="hover:bg-[#f3e9e0] transition">
                <i className="fas fa-history mr-2"></i>
                History
              </Button>
              <Button variant="ghost" size="sm" className="hover:bg-[#f3e9e0] transition">
                <i className="fas fa-cog mr-2"></i>
                Settings
              </Button>
              <Button 
                onClick={handleExportDesign}
                className="bg-[#a78bfa] text-white font-bold shadow-md hover:bg-[#7c3aed] transition-colors"
              >
                <i className="fas fa-paper-plane mr-2"></i>
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8 relative">
        {/* Left: Gallery */}
        <section className={`fixed md:relative inset-y-0 left-0 w-full md:w-auto bg-[#faf9f7] rounded-2xl shadow p-6 border border-[#f3e9e0] transition-all duration-300 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:hidden'
        }`}>
          <BaseDesignGallery 
            baseDesigns={baseDesigns} 
            subDesigns={subDesigns}
            selectedBaseDesign={selectedBaseDesign}
            selectedSubDesigns={selectedSubDesigns}
            onSelectBaseDesign={handleSelectBaseDesign}
            onToggleSubDesign={handleSubDesignToggle}
            isLoading={loadingBaseDesigns || loadingSubDesigns}
          />
        </section>
        {/* Center: Workspace */}
        <section className={`bg-[#faf9f7] rounded-2xl shadow p-6 border border-[#f3e9e0] transition-all duration-300 ${
          isSidebarOpen ? 'md:col-span-1' : 'md:col-span-2'
        }`}>
          <DesignWorkspace 
            currentProject={currentProject}
            selectedBaseDesign={selectedBaseDesign}
            onGenerateDesign={handleGenerateDesign}
            onExportDesign={handleExportDesign}
            isGenerating={isGenerating}
          />
        </section>
        {/* Right: Chat */}
        <section className="bg-[#faf9f7] rounded-2xl shadow p-6 border border-[#f3e9e0] flex flex-col">
          <ChatInterface 
            currentProject={currentProject}
            onGenerateDesign={handleGenerateDesign}
            isGenerating={isGenerating}
          />
        </section>
      </main>
      {/* Loading Overlay */}
      <LoadingOverlay isVisible={isGenerating || loadingBaseDesigns || loadingSubDesigns} />
    </div>
  );
}