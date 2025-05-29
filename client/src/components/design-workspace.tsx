import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { DesignProject, BaseDesign } from "@shared/schema";

interface DesignWorkspaceProps {
  currentProject: DesignProject | null;
  selectedBaseDesign: BaseDesign | null;
  onGenerateDesign: (prompt: string) => void;
  onExportDesign: () => void;
  isGenerating: boolean;
}

export default function DesignWorkspace({
  currentProject,
  selectedBaseDesign,
  onGenerateDesign,
  onExportDesign,
  isGenerating,
}: DesignWorkspaceProps) {
  const [selectedIteration, setSelectedIteration] = useState<string | null>(null);

  const getCurrentImage = () => {
    if (currentProject?.currentDesignData?.imageUrl) {
      return currentProject.currentDesignData.imageUrl;
    }
    if (selectedBaseDesign?.imageUrl) {
      return selectedBaseDesign.imageUrl;
    }
    return null;
  };

  const getCurrentTitle = () => {
    if (currentProject?.name) {
      return currentProject.name;
    }
    if (selectedBaseDesign?.name) {
      return selectedBaseDesign.name;
    }
    return "Select a base design to begin";
  };

  const getCurrentDescription = () => {
    if (currentProject?.currentDesignData?.prompt) {
      return currentProject.currentDesignData.prompt;
    }
    if (selectedBaseDesign?.description) {
      return selectedBaseDesign.description;
    }
    return "Choose from our curated collection of base jewelry designs";
  };

  const handleQuickGenerate = (prompt: string) => {
    onGenerateDesign(prompt);
  };

  return (
    <div className="space-y-6">
      {/* Main Design Workspace */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-[hsl(var(--navy))]">Design Workspace</h2>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" disabled>
                <i className="fas fa-undo mr-2"></i>
                Undo
              </Button>
              <Button variant="ghost" size="sm" disabled>
                <i className="fas fa-redo mr-2"></i>
                Redo
              </Button>
            </div>
          </div>

          {/* Current Design Display */}
          <div className="mb-6">
            <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl p-8 text-center border-2 border-dashed border-border">
              <div className="space-y-4">
                {getCurrentImage() ? (
                  <img 
                    src={getCurrentImage()!} 
                    alt="Current Design Preview" 
                    className="mx-auto rounded-lg shadow-md w-full max-w-sm object-cover h-64"
                  />
                ) : (
                  <div className="mx-auto rounded-lg shadow-md w-full max-w-sm h-64 bg-muted flex items-center justify-center">
                    <i className="fas fa-gem text-6xl text-muted-foreground"></i>
                  </div>
                )}
                <div className="space-y-2">
                  <h3 className="font-semibold text-[hsl(var(--navy))]">{getCurrentTitle()}</h3>
                  <p className="text-sm text-muted-foreground">{getCurrentDescription()}</p>
                  {currentProject && (
                    <Badge variant="outline" className="mt-2">
                      Status: {currentProject.status}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Design Controls */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[hsl(var(--navy))]">Design Iterations</label>
              <Badge variant="secondary">
                {currentProject?.designIterations?.length || 0} versions
              </Badge>
            </div>
            
            {/* Iteration History */}
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {currentProject?.designIterations?.map((iteration) => (
                <div 
                  key={iteration.id}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg cursor-pointer transition-all ${
                    selectedIteration === iteration.id 
                      ? "ring-2 ring-[hsl(var(--amethyst))]" 
                      : "hover:ring-2 hover:ring-[hsl(var(--amethyst))]/50"
                  }`}
                  onClick={() => setSelectedIteration(iteration.id)}
                >
                  <img 
                    src={iteration.imageUrl} 
                    alt="Design Iteration" 
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              ))}
              <div className="flex-shrink-0 w-20 h-20 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors flex items-center justify-center">
                <i className="fas fa-plus text-muted-foreground text-xl"></i>
              </div>
            </div>

            {/* Generation Status */}
            <div className="bg-gradient-to-r from-[hsl(var(--amethyst))]/10 to-[hsl(var(--emerald))]/10 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${isGenerating ? 'bg-[hsl(var(--ruby))] animate-pulse' : 'bg-[hsl(var(--emerald))]'}`}></div>
                <span className={`text-sm font-medium ${isGenerating ? 'text-[hsl(var(--ruby))]' : 'text-[hsl(var(--emerald))]'}`}>
                  {isGenerating ? "Generating design..." : "Ready for generation"}
                </span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleQuickGenerate("Make the design more elegant and refined")}
                disabled={!selectedBaseDesign || isGenerating}
                className="bg-[hsl(var(--amethyst))] hover:bg-[hsl(var(--amethyst))]/90 text-white"
              >
                <i className="fas fa-magic mr-2"></i>
                Generate
              </Button>
              <Button
                onClick={() => handleQuickGenerate("Refine the current design with more detail")}
                disabled={!selectedBaseDesign || isGenerating}
                variant="outline"
                className="border-[hsl(var(--amethyst))] text-[hsl(var(--amethyst))] hover:bg-[hsl(var(--amethyst))] hover:text-white"
              >
                <i className="fas fa-edit mr-2"></i>
                Refine
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manufacturing Handoff */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-[hsl(var(--navy))] mb-4">Manufacturing Ready</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Design Specifications</span>
              <Button variant="ghost" size="sm" className="text-[hsl(var(--amethyst))] hover:text-[hsl(var(--amethyst))]/80">
                <i className="fas fa-download mr-1"></i>
                Download
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">3D Model Files</span>
              <Button variant="ghost" size="sm" className="text-[hsl(var(--amethyst))] hover:text-[hsl(var(--amethyst))]/80">
                <i className="fas fa-cube mr-1"></i>
                Export
              </Button>
            </div>
            <Separator />
            <Button 
              onClick={onExportDesign}
              disabled={!currentProject}
              className="w-full bg-[hsl(var(--luxury-gold))] hover:bg-[hsl(var(--luxury-gold))]/90 text-white font-semibold py-3"
            >
              <i className="fas fa-paper-plane mr-2"></i>
              Send to Manufacturing
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
