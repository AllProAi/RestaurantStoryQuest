import { type InsertResponse, type Response, type InsertUser, type User, type Question, users, questions, responses } from "@shared/schema";
import { hashPassword } from "./auth";
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq, and } from 'drizzle-orm';
import { db } from './db';

export interface IStorage {
  // User operations
  createUser(userData: InsertUser, role?: string): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;

  // Question operations
  getQuestions(): Promise<Question[]>;

  // Response operations
  createOrUpdateResponse(response: InsertResponse & { userId: number }): Promise<Response>;
  getResponse(id: number): Promise<Response | undefined>;
  getResponsesByUser(userId: number): Promise<Response[]>;
  deleteAllResponsesByUser(userId: number): Promise<void>;
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

  async createOrUpdateResponse(response: InsertResponse & { userId: number }): Promise<Response> {
    console.log('Creating/Updating response with data:', response);

    try {
      // Check if response already exists for this question and user
      const existingResponse = await db.select()
        .from(responses)
        .where(
          and(
            eq(responses.questionId, response.questionId),
            eq(responses.userId, response.userId)
          )
        )
        .limit(1);

      if (existingResponse.length > 0) {
        // Update existing response
        console.log('Updating existing response:', existingResponse[0].id);
        const [updatedResponse] = await db.update(responses)
          .set({
            textResponse: response.textResponse,
            audioUrl: response.audioUrl,
            transcriptions: response.transcriptions || [],
          })
          .where(eq(responses.id, existingResponse[0].id))
          .returning();

        console.log('Updated response:', updatedResponse);
        return updatedResponse;
      } else {
        // Create new response
        console.log('Creating new response');
        const [newResponse] = await db.insert(responses)
          .values({
            questionId: response.questionId,
            userId: response.userId,
            textResponse: response.textResponse || '',
            audioUrl: response.audioUrl || '',
            transcriptions: response.transcriptions || [],
          })
          .returning();

        console.log('Created response:', newResponse);
        return newResponse;
      }
    } catch (error) {
      console.error('Error creating/updating response:', error);
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
        .where(eq(responses.userId, userId))
        .orderBy(responses.questionId);

      console.log('Found responses:', userResponses);
      return userResponses;
    } catch (error) {
      console.error('Error getting responses:', error);
      throw error;
    }
  }

  async deleteAllResponsesByUser(userId: number): Promise<void> {
    try {
      console.log('Deleting all responses for user:', userId);
      await db.delete(responses)
        .where(eq(responses.userId, userId));
      console.log('Successfully deleted all responses for user:', userId);
    } catch (error) {
      console.error('Error deleting responses:', error);
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
      password: 'onlythebeginning',
      name: 'Administrator',
      confirmPassword: 'onlythebeginning',
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

  // Create Lisa user
  const lisaExists = await storage.getUserByUsername('Lisa');
  if (!lisaExists) {
    await storage.createUser({
      username: 'Lisa',
      password: 'onlythebeginning',
      name: 'Lisa',
      confirmPassword: 'onlythebeginning',
    });
  }
}

initializeDefaultUsers().catch(console.error);