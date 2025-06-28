import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogService } from '../../modules/audit-log/audit-log.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
    constructor(private readonly auditLogService: AuditLogService) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const { method, url, user, ip, headers } = request;
        const userAgent = headers['user-agent'];

        return next.handle().pipe(
            tap(async (data) => {
                // Only log certain operations
                if (this.shouldLog(method, url)) {
                    try {
                        const action = this.getActionFromMethod(method);
                        const tableName = this.getTableNameFromUrl(url);
                        const recordId = this.getRecordIdFromUrl(url) || 'unknown';

                        await this.auditLogService.logAction(
                            tableName,
                            recordId,
                            action,
                            user?.userId,
                            user?.loginName,
                            null, // oldValues - would need to be captured before operation
                            data, // newValues
                            ip,
                            userAgent,
                            `${method} ${url}`
                        );
                    } catch (error) {
                        console.error('Failed to log audit entry:', error);
                    }
                }
            }),
        );
    }

    private shouldLog(method: string, url: string): boolean {
        // Only log POST, PUT, PATCH, DELETE operations
        const methodsToLog = ['POST', 'PUT', 'PATCH', 'DELETE'];
        
        // Skip audit log endpoints to avoid infinite loops
        if (url.includes('/audit-logs')) {
            return false;
        }

        return methodsToLog.includes(method);
    }

    private getActionFromMethod(method: string): 'INSERT' | 'UPDATE' | 'DELETE' {
        switch (method) {
            case 'POST':
                return 'INSERT';
            case 'PUT':
            case 'PATCH':
                return 'UPDATE';
            case 'DELETE':
                return 'DELETE';
            default:
                return 'UPDATE';
        }
    }

    private getTableNameFromUrl(url: string): string {
        // Extract table name from URL
        // e.g., /api/cau-hoi/123 -> CauHoi
        const segments = url.split('/').filter(segment => segment);
        if (segments.length > 0) {
            const tableName = segments[0];
            return this.convertUrlToTableName(tableName);
        }
        return 'Unknown';
    }

    private getRecordIdFromUrl(url: string): string | null {
        // Extract ID from URL
        // e.g., /api/cau-hoi/123 -> 123
        const segments = url.split('/').filter(segment => segment);
        if (segments.length > 1) {
            const lastSegment = segments[segments.length - 1];
            // Check if it's a UUID or number
            if (this.isValidId(lastSegment)) {
                return lastSegment;
            }
        }
        return null;
    }

    private convertUrlToTableName(urlSegment: string): string {
        const mapping: { [key: string]: string } = {
            'cau-hoi': 'CauHoi',
            'cau-tra-loi': 'CauTraLoi',
            'cau-hoi-cho-duyet': 'CauHoiChoDuyet',
            'mon-hoc': 'MonHoc',
            'khoa': 'Khoa',
            'phan': 'Phan',
            'de-thi': 'DeThi',
            'chi-tiet-de-thi': 'ChiTietDeThi',
            'users': 'User',
            'clo': 'CLO',
            'files': 'Files',
            'notifications': 'Notification',
        };

        return mapping[urlSegment] || urlSegment;
    }

    private isValidId(id: string): boolean {
        // Check if it's a UUID or number
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        const numberRegex = /^\d+$/;
        
        return uuidRegex.test(id) || numberRegex.test(id);
    }
}
