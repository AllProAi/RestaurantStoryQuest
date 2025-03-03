import { pgTable, text, serial, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const questionnaireResponses = pgTable("questionnaire_responses", {
  id: serial("id").primaryKey(),
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

export const insertResponseSchema = createInsertSchema(questionnaireResponses);

export type InsertResponse = z.infer<typeof insertResponseSchema>;
export type QuestionnaireResponse = typeof questionnaireResponses.$inferSelect;
