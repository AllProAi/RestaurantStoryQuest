import { pgTable, text, serial, json, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("user"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const questionnaireResponses = pgTable("questionnaire_responses", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id),
  personalJourney: json("personal_journey").$type<{
    childhood: string;
    immigration: string;
    challenges: string;
    familyRecipes: string;
    influences: string;
    customs: string;
  }>(),
  culinaryHeritage: json("culinary_heritage").$type<{
    signatureDishes: string;
    ingredients: string;
    techniques: string;
    recipeEvolution: string;
    fusion: string;
    menuPhilosophy: string;
  }>(),
  businessDevelopment: json("business_development").$type<{
    inspiration: string;
    timeline: string;
    vision: string;
    challenges: string;
    achievements: string;
    aspirations: string;
  }>(),
  communityConnections: json("community_connections").$type<{
    customers: string;
    localBusiness: string;
    events: string;
    economy: string;
    jamaicanCommunity: string;
  }>(),
  visualPreferences: json("visual_preferences").$type<{
    colors: string[];
    imagery: string;
    symbols: string;
    atmosphere: string;
    tone: string;
  }>(),
  mediaUrls: text("media_urls").array(),
  language: text("language").notNull(),
  lastSaved: timestamp("last_saved").notNull().defaultNow(),
});

// Schema for user registration
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true,
  passwordHash: true,
  createdAt: true,
  role: true,
}).extend({
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const insertResponseSchema = createInsertSchema(questionnaireResponses);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertResponse = z.infer<typeof insertResponseSchema>;
export type User = typeof users.$inferSelect;
export type QuestionnaireResponse = typeof questionnaireResponses.$inferSelect;