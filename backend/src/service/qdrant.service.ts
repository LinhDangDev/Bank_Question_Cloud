import { Injectable } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';

@Injectable()
export class QdrantService {
  private client = new QdrantClient({ host: 'qdrant', port: 6333 });

  async createCollection(collectionName: string, vectorSize: number) {
    await this.client.createCollection(collectionName, {
      vectors: { size: vectorSize, distance: 'Cosine' },
    });
  }

  async uploadVectors(collectionName: string, vectors: any[]) {
    await this.client.uploadCollection(collectionName, vectors);
  }

  async search(collectionName: string, query: string) {
    const result = await this.client.query({
      collectionName,
      queryText: query,
      limit: 5,
    });
    return result;
  }
}
