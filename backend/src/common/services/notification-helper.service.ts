import { Injectable } from '@nestjs/common';
import { NotificationService } from '../../modules/notification/notification.service';

export enum NotificationType {
    QUESTION_SUBMITTED = 'QUESTION_SUBMITTED',
    QUESTION_APPROVED = 'QUESTION_APPROVED',
    QUESTION_REJECTED = 'QUESTION_REJECTED',
    EXAM_CREATED = 'EXAM_CREATED',
    SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
    USER_CREATED = 'USER_CREATED',
    PASSWORD_CHANGED = 'PASSWORD_CHANGED',
}

@Injectable()
export class NotificationHelperService {
    constructor(private readonly notificationService: NotificationService) {}

    async notifyQuestionSubmitted(teacherId: string, questionId: string): Promise<void> {
        await this.notificationService.createSystemNotification(
            teacherId,
            'Câu hỏi đã được gửi duyệt',
            'Câu hỏi của bạn đã được gửi để admin duyệt. Bạn sẽ nhận được thông báo khi có kết quả.',
            NotificationType.QUESTION_SUBMITTED,
            'CauHoiChoDuyet',
            questionId
        );
    }

    async notifyQuestionApproved(teacherId: string, questionId: string, adminName: string): Promise<void> {
        await this.notificationService.createSystemNotification(
            teacherId,
            'Câu hỏi đã được duyệt',
            `Câu hỏi của bạn đã được ${adminName} duyệt và thêm vào ngân hàng câu hỏi.`,
            NotificationType.QUESTION_APPROVED,
            'CauHoi',
            questionId
        );
    }

    async notifyQuestionRejected(teacherId: string, questionId: string, adminName: string, reason: string): Promise<void> {
        await this.notificationService.createSystemNotification(
            teacherId,
            'Câu hỏi bị từ chối',
            `Câu hỏi của bạn đã bị ${adminName} từ chối. Lý do: ${reason}`,
            NotificationType.QUESTION_REJECTED,
            'CauHoiChoDuyet',
            questionId
        );
    }

    async notifyExamCreated(userIds: string[], examName: string, examId: string): Promise<void> {
        const promises = userIds.map(userId =>
            this.notificationService.createSystemNotification(
                userId,
                'Đề thi mới được tạo',
                `Đề thi "${examName}" đã được tạo và sẵn sàng sử dụng.`,
                NotificationType.EXAM_CREATED,
                'DeThi',
                examId
            )
        );

        await Promise.all(promises);
    }

    async notifySystemMaintenance(userIds: string[], message: string): Promise<void> {
        const promises = userIds.map(userId =>
            this.notificationService.createSystemNotification(
                userId,
                'Thông báo bảo trì hệ thống',
                message,
                NotificationType.SYSTEM_MAINTENANCE
            )
        );

        await Promise.all(promises);
    }

    async notifyUserCreated(userId: string, adminName: string): Promise<void> {
        await this.notificationService.createSystemNotification(
            userId,
            'Tài khoản được tạo',
            `Tài khoản của bạn đã được ${adminName} tạo. Vui lòng đổi mật khẩu khi đăng nhập lần đầu.`,
            NotificationType.USER_CREATED,
            'User',
            userId
        );
    }

    async notifyPasswordChanged(userId: string): Promise<void> {
        await this.notificationService.createSystemNotification(
            userId,
            'Mật khẩu đã được thay đổi',
            'Mật khẩu của bạn đã được thay đổi thành công.',
            NotificationType.PASSWORD_CHANGED,
            'User',
            userId
        );
    }

    async notifyAdminsNewQuestionSubmission(adminIds: string[], teacherName: string, questionId: string): Promise<void> {
        const promises = adminIds.map(adminId =>
            this.notificationService.createSystemNotification(
                adminId,
                'Câu hỏi mới cần duyệt',
                `Giáo viên ${teacherName} đã gửi câu hỏi mới cần được duyệt.`,
                NotificationType.QUESTION_SUBMITTED,
                'CauHoiChoDuyet',
                questionId
            )
        );

        await Promise.all(promises);
    }
}
