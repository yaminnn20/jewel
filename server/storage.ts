import { 
  baseDesigns, subDesigns, designProjects, manufacturingOrders,
  type BaseDesign, type SubDesign, type DesignProject, type ManufacturingOrder,
  type InsertBaseDesign, type InsertSubDesign, type InsertDesignProject, type InsertManufacturingOrder
} from "@shared/schema";

export interface IStorage {
  // Base Designs
  getBaseDesigns(): Promise<BaseDesign[]>;
  getBaseDesignsByCategory(category: string): Promise<BaseDesign[]>;
  getBaseDesign(id: number): Promise<BaseDesign | undefined>;
  createBaseDesign(design: InsertBaseDesign): Promise<BaseDesign>;

  // Sub Designs
  getSubDesigns(): Promise<SubDesign[]>;
  getSubDesign(id: number): Promise<SubDesign | undefined>;
  createSubDesign(design: InsertSubDesign): Promise<SubDesign>;

  // Design Projects
  getDesignProjects(): Promise<DesignProject[]>;
  getDesignProject(id: number): Promise<DesignProject | undefined>;
  createDesignProject(project: InsertDesignProject): Promise<DesignProject>;
  updateDesignProject(id: number, updates: Partial<DesignProject>): Promise<DesignProject>;

  // Manufacturing Orders
  getManufacturingOrders(): Promise<ManufacturingOrder[]>;
  getManufacturingOrder(id: number): Promise<ManufacturingOrder | undefined>;
  createManufacturingOrder(order: InsertManufacturingOrder): Promise<ManufacturingOrder>;
  updateManufacturingOrder(id: number, updates: Partial<ManufacturingOrder>): Promise<ManufacturingOrder>;
}

export class MemStorage implements IStorage {
  private baseDesigns: Map<number, BaseDesign>;
  private subDesigns: Map<number, SubDesign>;
  private designProjects: Map<number, DesignProject>;
  private manufacturingOrders: Map<number, ManufacturingOrder>;
  private currentId: number;

  constructor() {
    this.baseDesigns = new Map();
    this.subDesigns = new Map();
    this.designProjects = new Map();
    this.manufacturingOrders = new Map();
    this.currentId = 1;

    // Initialize with sample base designs
    this.initializeBaseDesigns();
    this.initializeSubDesigns();
  }

  private initializeBaseDesigns() {
    const sampleDesigns: InsertBaseDesign[] = [
      {
        name: "Classic Solitaire",
        category: "rings",
        description: "Timeless diamond solitaire ring with platinum band",
        imageUrl: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        specifications: {
          materials: ["Platinum", "Diamond"],
          dimensions: { width: "10mm", height: "15mm", depth: "5mm" },
          weight: "3.2g"
        }
      },
      {
        name: "Pearl Elegance",
        category: "necklaces",
        description: "Elegant pearl necklace with gold chain",
        imageUrl: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        specifications: {
          materials: ["Gold", "Pearl"],
          dimensions: { width: "450mm", height: "12mm", depth: "8mm" },
          weight: "15.6g"
        }
      },
      {
        name: "Geometric Drop",
        category: "earrings",
        description: "Modern geometric earrings with gemstones",
        imageUrl: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        specifications: {
          materials: ["Gold", "Sapphire"],
          dimensions: { width: "8mm", height: "25mm", depth: "4mm" },
          weight: "2.8g"
        }
      },
      {
        name: "Tennis Classic",
        category: "bracelets",
        description: "Diamond tennis bracelet with uniform stones",
        imageUrl: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        specifications: {
          materials: ["Gold", "Diamond"],
          dimensions: { width: "180mm", height: "6mm", depth: "3mm" },
          weight: "8.4g"
        }
      },
      {
        name: "Art Deco Luxury",
        category: "rings",
        description: "Art deco inspired ring with geometric patterns",
        imageUrl: "https://images.unsplash.com/photo-1603561596112-0a132b757442?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        specifications: {
          materials: ["White Gold", "Emerald", "Diamond"],
          dimensions: { width: "12mm", height: "18mm", depth: "6mm" },
          weight: "4.1g"
        }
      },
      {
        name: "Bold Statement",
        category: "necklaces",
        description: "Multi-layer geometric necklace",
        imageUrl: "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        specifications: {
          materials: ["Gold", "Diamond"],
          dimensions: { width: "500mm", height: "25mm", depth: "10mm" },
          weight: "28.3g"
        }
      }
    ];

    sampleDesigns.forEach(design => {
      this.createBaseDesign(design);
    });
  }

  private initializeSubDesigns() {
    const sampleSubDesigns: InsertSubDesign[] = [
      { name: "Diamond Accent", type: "enhancement", description: "Add diamond accents", iconName: "fas fa-star" },
      { name: "Engraving", type: "modification", description: "Custom engraving", iconName: "fas fa-font" },
      { name: "Gold Plating", type: "enhancement", description: "Gold plating finish", iconName: "fas fa-palette" },
      { name: "Gemstone", type: "enhancement", description: "Add gemstones", iconName: "fas fa-gem" },
      { name: "Vintage Style", type: "modification", description: "Vintage styling", iconName: "fas fa-crown" },
      { name: "Modern Polish", type: "enhancement", description: "Modern polish finish", iconName: "fas fa-circle" }
    ];

    sampleSubDesigns.forEach(design => {
      this.createSubDesign(design);
    });
  }

  async getBaseDesigns(): Promise<BaseDesign[]> {
    return Array.from(this.baseDesigns.values());
  }

  async getBaseDesignsByCategory(category: string): Promise<BaseDesign[]> {
    return Array.from(this.baseDesigns.values()).filter(design => design.category === category);
  }

  async getBaseDesign(id: number): Promise<BaseDesign | undefined> {
    return this.baseDesigns.get(id);
  }

  async createBaseDesign(design: InsertBaseDesign): Promise<BaseDesign> {
    const id = this.currentId++;
    const newDesign: BaseDesign = { ...design, id };
    this.baseDesigns.set(id, newDesign);
    return newDesign;
  }

  async getSubDesigns(): Promise<SubDesign[]> {
    return Array.from(this.subDesigns.values());
  }

  async getSubDesign(id: number): Promise<SubDesign | undefined> {
    return this.subDesigns.get(id);
  }

  async createSubDesign(design: InsertSubDesign): Promise<SubDesign> {
    const id = this.currentId++;
    const newDesign: SubDesign = { ...design, id };
    this.subDesigns.set(id, newDesign);
    return newDesign;
  }

  async getDesignProjects(): Promise<DesignProject[]> {
    return Array.from(this.designProjects.values());
  }

  async getDesignProject(id: number): Promise<DesignProject | undefined> {
    return this.designProjects.get(id);
  }

  async createDesignProject(project: InsertDesignProject): Promise<DesignProject> {
    const id = this.currentId++;
    const now = new Date();
    const newProject: DesignProject = { 
      ...project, 
      id,
      createdAt: now,
      updatedAt: now
    };
    this.designProjects.set(id, newProject);
    return newProject;
  }

  async updateDesignProject(id: number, updates: Partial<DesignProject>): Promise<DesignProject> {
    const project = this.designProjects.get(id);
    if (!project) {
      throw new Error(`Design project with id ${id} not found`);
    }
    const updatedProject = { ...project, ...updates, updatedAt: new Date() };
    this.designProjects.set(id, updatedProject);
    return updatedProject;
  }

  async getManufacturingOrders(): Promise<ManufacturingOrder[]> {
    return Array.from(this.manufacturingOrders.values());
  }

  async getManufacturingOrder(id: number): Promise<ManufacturingOrder | undefined> {
    return this.manufacturingOrders.get(id);
  }

  async createManufacturingOrder(order: InsertManufacturingOrder): Promise<ManufacturingOrder> {
    const id = this.currentId++;
    const newOrder: ManufacturingOrder = { 
      ...order, 
      id,
      createdAt: new Date()
    };
    this.manufacturingOrders.set(id, newOrder);
    return newOrder;
  }

  async updateManufacturingOrder(id: number, updates: Partial<ManufacturingOrder>): Promise<ManufacturingOrder> {
    const order = this.manufacturingOrders.get(id);
    if (!order) {
      throw new Error(`Manufacturing order with id ${id} not found`);
    }
    const updatedOrder = { ...order, ...updates };
    this.manufacturingOrders.set(id, updatedOrder);
    return updatedOrder;
  }
}

export const storage = new MemStorage();
