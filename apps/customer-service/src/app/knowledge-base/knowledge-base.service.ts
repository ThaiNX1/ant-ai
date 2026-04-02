import { Injectable } from '@nestjs/common';
import { LlmService } from '@ai-platform/ai-core';
import { SearchDto } from './dto/search.dto';

export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  score: number;
}

export interface SearchResult {
  answer: string;
  sources: KnowledgeArticle[];
}

@Injectable()
export class KnowledgeBaseService {
  private readonly articles: KnowledgeArticle[] = [];

  constructor(private readonly llmService: LlmService) {}

  async search(dto: SearchDto): Promise<SearchResult> {
    const limit = dto.limit || 5;

    // RAG Step 1: Retrieve relevant articles
    const relevantArticles = this.retrieveArticles(dto.query, limit);

    // RAG Step 2: Augment prompt with context
    const context = relevantArticles
      .map((a) => `[${a.title}]: ${a.content}`)
      .join('\n\n');

    const prompt = this.buildRagPrompt(dto.query, context);

    // RAG Step 3: Generate answer via LLM
    const answer = await this.llmService.generate(prompt);

    return {
      answer,
      sources: relevantArticles,
    };
  }

  private retrieveArticles(query: string, limit: number): KnowledgeArticle[] {
    const queryLower = query.toLowerCase();
    return this.articles
      .map((article) => ({
        ...article,
        score: this.computeRelevance(queryLower, article),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private computeRelevance(query: string, article: KnowledgeArticle): number {
    const titleLower = article.title.toLowerCase();
    const contentLower = article.content.toLowerCase();
    const words = query.split(/\s+/);
    let score = 0;
    for (const word of words) {
      if (titleLower.includes(word)) score += 2;
      if (contentLower.includes(word)) score += 1;
    }
    return score;
  }

  private buildRagPrompt(query: string, context: string): string {
    return (
      `Dựa trên các tài liệu sau đây, hãy trả lời câu hỏi của khách hàng.\n\n` +
      `Tài liệu:\n${context}\n\n` +
      `Câu hỏi: ${query}\n\n` +
      `Trả lời:`
    );
  }
}
