import { type InsertResponse, type QuestionnaireResponse, type InsertUser, type User } from "@shared/schema";
import { hashPassword } from "./auth";

export interface IStorage {
  // User operations
  createUser(userData: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;

  // Questionnaire operations
  createResponse(response: InsertResponse): Promise<QuestionnaireResponse>;
  getResponse(id: number): Promise<QuestionnaireResponse | undefined>;
  getResponsesByUser(userId: number): Promise<QuestionnaireResponse[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private responses: Map<number, QuestionnaireResponse>;
  private currentUserId: number;
  private currentResponseId: number;

  constructor() {
    this.users = new Map();
    this.responses = new Map();
    this.currentUserId = 1;
    this.currentResponseId = 1;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const passwordHash = await hashPassword(userData.password);

    const newUser: User = {
      id,
      email: userData.email,
      passwordHash,
      name: userData.name,
      role: 'user',
      createdAt: new Date(),
    };

    this.users.set(id, newUser);
    return newUser;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async createResponse(response: InsertResponse): Promise<QuestionnaireResponse> {
    const id = this.currentResponseId++;
    const newResponse = {
      ...response,
      id,
      lastSaved: new Date(),
    };
    this.responses.set(id, newResponse);
    return newResponse;
  }

  async getResponse(id: number): Promise<QuestionnaireResponse | undefined> {
    return this.responses.get(id);
  }

  async getResponsesByUser(userId: number): Promise<QuestionnaireResponse[]> {
    return Array.from(this.responses.values())
      .filter(response => response.userId === userId);
  }
}

// Add initialization for default users
async function initializeDefaultUsers() {
  // Create admin user
  const adminExists = await storage.getUserByEmail('Administrator');
  if (!adminExists) {
    await storage.createUser({
      email: 'Administrator',
      password: 'Testing1234@',
      name: 'Administrator',
      confirmPassword: 'Testing1234@',
    });
  }

  // Create regular user
  const userExists = await storage.getUserByEmail('JamaicanSpicy');
  if (!userExists) {
    await storage.createUser({
      email: 'JamaicanSpicy',
      password: 'TempPass@STX',
      name: 'Jamaican Spicy',
      confirmPassword: 'TempPass@STX',
    });
  }
}

export const storage = new MemStorage();
initializeDefaultUsers().catch(console.error);