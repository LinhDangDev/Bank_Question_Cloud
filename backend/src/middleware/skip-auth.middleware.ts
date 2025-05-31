import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SkipAuthMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        // Mock user data
        req['user'] = {
            id: '11111111-1111-1111-1111-111111111111',
            username: 'admin',
            IsBuildInUser: true,
            roles: ['admin']
        };
        next();
    }
}
