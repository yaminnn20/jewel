import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const baseDesigns = pgTable("base_designs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // rings, necklaces, earrings, bracelets
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  specifications: jsonb("specifications").$type<{
    materials: string[];
    dimensions: { width: string; height: string; depth: string };
    weight: string;
  }>(),
});

export const subDesigns = pgTable("sub_designs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // enhancement, modification, etc.
  description: text("description").notNull(),
  iconName: text("icon_name").notNull(),
});

export const designProjects = pgTable("design_projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  baseDesignId: integer("base_design_id").references(() => baseDesigns.id),
  currentDesignData: jsonb("current_design_data").$type<{
    imageUrl: string;
    prompt: string;
    specifications: any;
  }>(),
  chatHistory: jsonb("chat_history").$type<Array<{
    id: string;
    content: string;
    isUser: boolean;
    timestamp: string;
  }>>().default([]),
  designIterations: jsonb("design_iterations").$type<Array<{
    id: string;
    imageUrl: string;
    prompt: string;
    timestamp: string;
  }>>().default([]),
  selectedSubDesigns: jsonb("selected_sub_designs").$type<number[]>().default([]),
  status: text("status").notNull().default("draft"), // draft, final, manufacturing
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const manufacturingOrders = pgTable("manufacturing_orders", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => designProjects.id),
  specifications: jsonb("specifications").$type<{
    materials: string[];
    dimensions: { width: string; height: string; depth: string };
    weight: string;
    finish: string;
    timeline: string;
    price: number;
  }>(),
  status: text("status").notNull().default("pending"), // pending, approved, manufacturing, completed
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBaseDesignSchema = createInsertSchema(baseDesigns).omit({
  id: true,
});

export const insertSubDesignSchema = createInsertSchema(subDesigns).omit({
  id: true,
});

export const insertDesignProjectSchema = createInsertSchema(designProjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertManufacturingOrderSchema = createInsertSchema(manufacturingOrders).omit({
  id: true,
  createdAt: true,
});

export type BaseDesign = typeof baseDesigns.$inferSelect;
export type SubDesign = typeof subDesigns.$inferSelect;
export type DesignProject = typeof designProjects.$inferSelect;
export type ManufacturingOrder = typeof manufacturingOrders.$inferSelect;

export type InsertBaseDesign = z.infer<typeof insertBaseDesignSchema>;
export type InsertSubDesign = z.infer<typeof insertSubDesignSchema>;
export type InsertDesignProject = z.infer<typeof insertDesignProjectSchema>;
export type InsertManufacturingOrder = z.infer<typeof insertManufacturingOrderSchema>;
