import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { BaseDesign, SubDesign } from "@shared/schema";

interface BaseDesignGalleryProps {
  baseDesigns: BaseDesign[];
  subDesigns: SubDesign[];
  selectedBaseDesign: BaseDesign | null;
  selectedSubDesigns: number[];
  onSelectBaseDesign: (design: BaseDesign) => void;
  onToggleSubDesign: (subDesignId: number) => void;
  isLoading: boolean;
}

export default function BaseDesignGallery({
  baseDesigns,
  subDesigns,
  selectedBaseDesign,
  selectedSubDesigns,
  onSelectBaseDesign,
  onToggleSubDesign,
  isLoading,
}: BaseDesignGalleryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = ["all", "rings", "necklaces", "earrings", "bracelets"];

  const filteredDesigns = baseDesigns.filter((design) => {
    const matchesSearch = design.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         design.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || design.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-10 w-full" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Base Designs */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-[hsl(var(--navy))]">Base Designs</h2>
            <Badge variant="secondary">{filteredDesigns.length} Available</Badge>
          </div>
          
          {/* Search and Filter */}
          <div className="space-y-4 mb-6">
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
              <Input
                type="text"
                placeholder="Search designs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={selectedCategory === category ? "bg-[hsl(var(--amethyst))] text-white" : ""}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Design Gallery */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredDesigns.map((design) => (
              <div
                key={design.id}
                className={`cursor-pointer group transition-all duration-200 ${
                  selectedBaseDesign?.id === design.id ? "gradient-border" : "border border-border rounded-lg"
                }`}
                onClick={() => onSelectBaseDesign(design)}
              >
                <div className={selectedBaseDesign?.id === design.id ? "gradient-border-content p-4" : "p-4"}>
                  <img 
                    src={design.imageUrl} 
                    alt={design.name}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-[hsl(var(--navy))]">{design.name}</h3>
                      <p className="text-sm text-muted-foreground">{design.category}</p>
                    </div>
                    <div className={`transition-opacity ${selectedBaseDesign?.id === design.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      <i className="fas fa-chevron-right text-[hsl(var(--amethyst))]"></i>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sub-designs Section */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-[hsl(var(--navy))] mb-4">Enhancement Options</h3>
          <div className="grid grid-cols-2 gap-3">
            {subDesigns.map((subDesign) => (
              <Button
                key={subDesign.id}
                variant={selectedSubDesigns.includes(subDesign.id) ? "default" : "outline"}
                className={`p-3 h-auto flex flex-col items-center justify-center transition-all ${
                  selectedSubDesigns.includes(subDesign.id) 
                    ? "bg-[hsl(var(--amethyst))] text-white hover:bg-[hsl(var(--amethyst))]/90" 
                    : "hover:border-[hsl(var(--amethyst))] hover:bg-[hsl(var(--amethyst))]/5"
                }`}
                onClick={() => onToggleSubDesign(subDesign.id)}
              >
                <i className={`${subDesign.iconName} mb-1 text-sm`}></i>
                <span className="text-xs font-medium">{subDesign.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
