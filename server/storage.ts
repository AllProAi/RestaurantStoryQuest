import { type InsertResponse, type Response, type InsertUser, type User, type Question, users, questions, responses } from "@shared/schema";
import { hashPassword } from "./auth";
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq } from 'drizzle-orm';
import { db } from './db';

export interface IStorage {
  // User operations
  createUser(userData: InsertUser, role?: string): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;

  // Question operations
  getQuestions(): Promise<Question[]>;

  // Response operations
  createResponse(response: InsertResponse & { userId: number }): Promise<Response>;
  getResponse(id: number): Promise<Response | undefined>;
  getResponsesByUser(userId: number): Promise<Response[]>;
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

  async getQuestions(): Promise<Question[]> {
    return db.select().from(questions).orderBy(questions.order);
  }

  async createResponse(response: InsertResponse & { userId: number }): Promise<Response> {
    console.log('Creating response with data:', response);

    try {
      const [newResponse] = await db.insert(responses)
        .values({
          questionId: response.questionId,
          userId: response.userId,
          textResponse: response.textResponse,
          audioUrl: response.audioUrl,
          transcription: response.transcription,
        })
        .returning();

      console.log('Created response:', newResponse);
      return newResponse;
    } catch (error) {
      console.error('Error creating response:', error);
      throw error;
    }
  }

  async getResponse(id: number): Promise<Response | undefined> {
    const results = await db.select()
      .from(responses)
      .where(eq(responses.id, id))
      .limit(1);

    return results[0];
  }

  async getResponsesByUser(userId: number): Promise<Response[]> {
    console.log('Getting responses for user:', userId);

    try {
      const userResponses = await db.select()
        .from(responses)
        .where(eq(responses.userId, userId));

      console.log('Found responses:', userResponses);
      return userResponses;
    } catch (error) {
      console.error('Error getting responses:', error);
      throw error;
    }
  }
}

export const storage = new PostgresStorage();

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