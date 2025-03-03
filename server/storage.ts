import { type InsertResponse, type QuestionnaireResponse } from "@shared/schema";

export interface IStorage {
  createResponse(response: InsertResponse): Promise<QuestionnaireResponse>;
  getResponse(id: number): Promise<QuestionnaireResponse | undefined>;
}

export class MemStorage implements IStorage {
  private responses: Map<number, QuestionnaireResponse>;
  private currentId: number;

  constructor() {
    this.responses = new Map();
    this.currentId = 1;
  }

  async createResponse(response: InsertResponse): Promise<QuestionnaireResponse> {
    const id = this.currentId++;
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
}

export const storage = new MemStorage();
