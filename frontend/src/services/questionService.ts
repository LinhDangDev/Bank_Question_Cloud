import api from './api';

interface GroupQuestionData {
    parentQuestion: any;
    childQuestions: any[];
}

export const questionService = {
    getAllQuestions: (params?: any) => api.get('/cau-hoi', { params }),
    getQuestionById: (id: string) => api.get(`/cau-hoi/${id}`),
    getQuestionFullDetails: (id: string) => api.get(`/cau-hoi/${id}/full`),
    getQuestionAnswers: (questionId: string) => api.get(`/cau-hoi/${questionId}/cau-tra-loi`),
    getQuestionsByChapter: (chapterId: string) => api.get(`/cau-hoi/by-chapter/${chapterId}`),
    getQuestionsByChapterWithAnswers: (chapterId: string) => api.get(`/cau-hoi/by-chapter/${chapterId}/with-answers`),
    getQuestionWithAnswers: (id: string) => api.get(`/cau-hoi/${id}/with-answers`),
    getChildQuestions: (parentId: string) => api.get(`/cau-hoi/${parentId}/children`),
    getGroupQuestion: (id: string) => api.get(`/cau-hoi/group/${id}`),
    createQuestion: (questionData: any) => api.post('/cau-hoi', questionData),
    createQuestionWithAnswers: (questionData: any) => api.post('/cau-hoi/with-answers', questionData),
    ensureNumericFields: (obj: any) => {
        const numericFields = ['MaSoCauHoi', 'CapDo', 'SoCauHoiCon', 'SoLanDuocThi', 'SoLanDung', 'ThuTu'];

        const result = { ...obj };

        numericFields.forEach(field => {
            if (field in result && result[field] !== undefined && result[field] !== null) {
                const numValue = Number(result[field]);

                if (isNaN(numValue)) {
                    console.warn(`Field ${field} với giá trị ${result[field]} không thể chuyển đổi thành số hợp lệ. Sử dụng giá trị mặc định.`);

                    switch (field) {
                        case 'MaSoCauHoi': result[field] = 1001; break;
                        case 'CapDo': result[field] = 1; break;
                        case 'SoCauHoiCon': result[field] = 0; break;
                        case 'SoLanDuocThi': result[field] = 0; break;
                        case 'SoLanDung': result[field] = 0; break;
                        case 'ThuTu': result[field] = 1; break;
                        default: result[field] = 0;
                    }
                } else {
                    result[field] = Number.isInteger(numValue) ? numValue : Math.floor(numValue);
                }
            }
        });

        return result;
    },
    checkCreateGroupQuestion: (data: GroupQuestionData) => {
        if (!data || !data.parentQuestion || !Array.isArray(data.childQuestions)) {
            throw new Error('Dữ liệu câu hỏi không đúng cấu trúc');
        }

        const requiredParentFields = ['MaPhan', 'HoanVi', 'CapDo', 'SoCauHoiCon'];
        for (const field of requiredParentFields) {
            if (data.parentQuestion[field] === undefined || data.parentQuestion[field] === null) {
                console.warn(`Parent question missing required field: ${field}`);

                if (field === 'HoanVi') data.parentQuestion[field] = true;
                else if (field === 'CapDo') data.parentQuestion[field] = 1;
                else if (field === 'SoCauHoiCon') data.parentQuestion[field] = data.childQuestions.length || 1;
            }
        }

        const parentQuestion = questionService.ensureNumericFields({
            ...data.parentQuestion,
            MaSoCauHoi: data.parentQuestion.MaSoCauHoi || 1001,
            NoiDung: data.parentQuestion.NoiDung || 'Câu hỏi nhóm',
            HoanVi: Boolean(data.parentQuestion.HoanVi !== undefined ? data.parentQuestion.HoanVi : true),
            SoCauHoiCon: data.childQuestions.length,
        });

        const childQuestions = data.childQuestions.map((child, index) => {
            if (!child.question) {
                child.question = {};
            }

            const requiredChildFields = ['MaPhan', 'NoiDung', 'HoanVi', 'CapDo'];
            for (const field of requiredChildFields) {
                if (child.question[field] === undefined || child.question[field] === null) {
                    if (field in parentQuestion) {
                        child.question[field] = parentQuestion[field];
                    } else {
                        if (field === 'MaPhan') child.question[field] = parentQuestion.MaPhan;
                        else if (field === 'HoanVi') child.question[field] = true;
                        else if (field === 'CapDo') child.question[field] = 1;
                    }
                }
            }

            const question = questionService.ensureNumericFields({
                ...child.question,
                MaPhan: child.question.MaPhan || parentQuestion.MaPhan,
                MaSoCauHoi: child.question.MaSoCauHoi || (2001 + index),
                NoiDung: child.question.NoiDung || `Câu hỏi con ${index + 1}`,
                SoCauHoiCon: 0,
                HoanVi: Boolean(child.question.HoanVi !== undefined ? child.question.HoanVi : true),
                MaCLO: child.question.MaCLO || parentQuestion.MaCLO,
                XoaTamCauHoi: false,
                SoLanDuocThi: 0,
                SoLanDung: 0
            });

            if (!Array.isArray(child.answers)) {
                child.answers = [];
            }

            let validAnswers = child.answers.filter((a: any) => a && a.NoiDung && a.NoiDung.trim() !== '');

            if (validAnswers.length < 2) {
                console.warn(`Child question ${index} has fewer than 2 valid answers. Adding default answers.`);
                validAnswers = [
                    { NoiDung: 'Đáp án 1', ThuTu: 1, LaDapAn: true, HoanVi: true },
                    { NoiDung: 'Đáp án 2', ThuTu: 2, LaDapAn: false, HoanVi: true }
                ];
            }

            if (!validAnswers.some((a: any) => a.LaDapAn)) {
                validAnswers[0].LaDapAn = true;
            }

            const answers = validAnswers.map((answer: any, ansIndex: number) => {
                return questionService.ensureNumericFields({
                    ...answer,
                    NoiDung: answer.NoiDung || `Đáp án ${ansIndex + 1}`,
                    ThuTu: answer.ThuTu || ansIndex + 1,
                    LaDapAn: Boolean(answer.LaDapAn),
                    HoanVi: Boolean(answer.HoanVi !== undefined ? answer.HoanVi : true),
                });
            });

            return { question, answers };
        });

        return { parentQuestion, childQuestions };
    },
    createGroupQuestion: (data: GroupQuestionData) => {
        const checkedData = questionService.checkCreateGroupQuestion(data);

        console.group('🔍 Dữ liệu câu hỏi nhóm trước khi gửi tới server');
        console.log('Raw data:', JSON.stringify(data, null, 2));
        console.log('Checked data:', JSON.stringify(checkedData, null, 2));

        const { parentQuestion, childQuestions } = checkedData;

        console.log('parentQuestion.MaSoCauHoi:', parentQuestion.MaSoCauHoi, typeof parentQuestion.MaSoCauHoi);
        console.log('parentQuestion.CapDo:', parentQuestion.CapDo, typeof parentQuestion.CapDo);
        console.log('parentQuestion.SoCauHoiCon:', parentQuestion.SoCauHoiCon, typeof parentQuestion.SoCauHoiCon);
        console.log('parentQuestion.HoanVi:', parentQuestion.HoanVi, typeof parentQuestion.HoanVi);

        if (childQuestions && childQuestions.length > 0) {
            console.log('Child question 0 MaSoCauHoi:',
                childQuestions[0].question.MaSoCauHoi,
                typeof childQuestions[0].question.MaSoCauHoi);
        }

        console.groupEnd();

        const finalData = {
            parentQuestion: {
                ...parentQuestion,
                MaSoCauHoi: Number(parentQuestion.MaSoCauHoi),
                CapDo: Number(parentQuestion.CapDo),
                SoCauHoiCon: Number(parentQuestion.SoCauHoiCon),
                HoanVi: Boolean(parentQuestion.HoanVi)
            },
            childQuestions: childQuestions.map(child => ({
                question: {
                    ...child.question,
                    MaSoCauHoi: Number(child.question.MaSoCauHoi),
                    CapDo: Number(child.question.CapDo),
                    SoCauHoiCon: Number(child.question.SoCauHoiCon || 0),
                    HoanVi: Boolean(child.question.HoanVi)
                },
                answers: child.answers.map((ans: any) => ({
                    ...ans,
                    ThuTu: Number(ans.ThuTu),
                    LaDapAn: Boolean(ans.LaDapAn),
                    HoanVi: Boolean(ans.HoanVi)
                }))
            }))
        };

        console.log('Final data to server:', JSON.stringify(finalData, null, 2));
        return api.post('/cau-hoi/group', finalData);
    },
    updateQuestion: (id: string, questionData: any) => api.put(`/cau-hoi/${id}`, questionData),
    updateQuestionWithAnswers: (id: string, questionData: any) => api.put(`/cau-hoi/${id}/with-answers`, questionData),
    updateGroupQuestion: (id: string, data: GroupQuestionData) => {
        const checkedData = questionService.checkCreateGroupQuestion(data);
        return api.put(`/cau-hoi/group/${id}`, checkedData);
    },
    deleteQuestion: (id: string) => api.delete(`/cau-hoi/${id}`),
    softDeleteQuestion: (id: string) => api.put(`/cau-hoi/${id}/soft-delete`),
    restoreQuestion: (id: string) => api.put(`/cau-hoi/${id}/restore`),
    deleteGroupQuestion: (id: string) => api.delete(`/cau-hoi/group/${id}`)
};
