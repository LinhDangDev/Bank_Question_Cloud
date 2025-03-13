/* eslint-disable prettier/prettier */
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

    async uploadVectors(collectionName: string, vectors: number[][]) {
        await this.client.upsert(collectionName, {
            points: vectors.map((vector, index) => ({
                id: `${index}-${Date.now()}`, // Tạo ID duy nhất
                vector // Đảm bảo vector là number[]
            }))
        });
    }

    async search(collectionName: string, queryVector: number[]) {
        // Fix: providing both required arguments to query method
        const result = await this.client.query(collectionName, {
            query: queryVector,
            limit: 5,
        });
        return result;
    }
}
