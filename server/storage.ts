import { type InsertResponse, type QuestionnaireResponse, type InsertUser, type User, users, questionnaireResponses } from "@shared/schema";
import { hashPassword } from "./auth";
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq } from 'drizzle-orm';
import { db } from './db';

export interface IStorage {
  // User operations
  createUser(userData: InsertUser, role?: string): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;

  // Questionnaire operations
  createResponse(response: InsertResponse & { userId: number }): Promise<QuestionnaireResponse>;
  getResponse(id: number): Promise<QuestionnaireResponse | undefined>;
  getResponsesByUser(userId: number): Promise<QuestionnaireResponse[]>;
}

export class PostgresStorage implements IStorage {
  async createUser(userData: InsertUser, role: string = 'user'): Promise<User> {
    const passwordHash = await hashPassword(userData.password);

    const [newUser] = await db.insert(users)
      .values({
        username: userData.username,
        passwordHash,
        name: userData.name,
        role,
      })
      .returning();

    return newUser;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await db.select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    return results[0];
  }

  async getUserById(id: number): Promise<User | undefined> {
    const results = await db.select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return results[0];
  }

  async createResponse(response: InsertResponse & { userId: number }): Promise<QuestionnaireResponse> {
    console.log('Creating response with data:', response);

    try {
      const [newResponse] = await db.insert(questionnaireResponses)
        .values({
          userId: response.userId,
          personalJourney: response.personalJourney,
          culinaryHeritage: response.culinaryHeritage,
          businessDevelopment: response.businessDevelopment,
          communityConnections: response.communityConnections,
          visualPreferences: response.visualPreferences,
          mediaUrls: response.mediaUrls || [],
          language: response.language,
        })
        .returning();

      console.log('Created response:', newResponse);
      return newResponse;
    } catch (error) {
      console.error('Error creating response:', error);
      throw error;
    }
  }

  async getResponse(id: number): Promise<QuestionnaireResponse | undefined> {
    const results = await db.select()
      .from(questionnaireResponses)
      .where(eq(questionnaireResponses.id, id))
      .limit(1);

    return results[0];
  }

  async getResponsesByUser(userId: number): Promise<QuestionnaireResponse[]> {
    console.log('Getting responses for user:', userId);

    try {
      const responses = await db.select()
        .from(questionnaireResponses)
        .where(eq(questionnaireResponses.userId, userId));

      console.log('Found responses:', responses);
      return responses;
    } catch (error) {
      console.error('Error getting responses:', error);
      throw error;
    }
  }
}

// Initialize storage instance
export const storage = new PostgresStorage();

// Add initialization for default users
async function initializeDefaultUsers() {
  // Create admin user
  const adminExists = await storage.getUserByUsername('Administrator');
  if (!adminExists) {
    await storage.createUser({
      username: 'Administrator',
      password: 'Testing1234@',
      name: 'Administrator',
      confirmPassword: 'Testing1234@',
    }, 'admin');
  }

  // Create regular user
  const userExists = await storage.getUserByUsername('JamaicanSpicy');
  if (!userExists) {
    await storage.createUser({
      username: 'JamaicanSpicy',
      password: 'TempPass@STX',
      name: 'Jamaican Spicy',
      confirmPassword: 'TempPass@STX',
    });
  }
}

initializeDefaultUsers().catch(console.error);