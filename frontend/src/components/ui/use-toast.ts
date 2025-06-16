import { toast as reactToastify } from 'react-toastify';

type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
    title?: string;
    description: string;
    type?: ToastType;
    duration?: number;
}

export function useToast() {
    const toast = (options: ToastOptions) => {
        const { title, description, type = 'default', duration = 5000 } = options;

        const content = title ? `${title}: ${description}` : description;

        switch (type) {
            case 'success':
                return reactToastify.success(content, { autoClose: duration });
            case 'error':
                return reactToastify.error(content, { autoClose: duration });
            case 'warning':
                return reactToastify.warning(content, { autoClose: duration });
            case 'info':
                return reactToastify.info(content, { autoClose: duration });
            default:
                return reactToastify(content, { autoClose: duration });
        }
    };

    return {
        toast,
        success: (description: string, title?: string) => toast({ title, description, type: 'success' }),
        error: (description: string, title?: string) => toast({ title, description, type: 'error' }),
        warning: (description: string, title?: string) => toast({ title, description, type: 'warning' }),
        info: (description: string, title?: string) => toast({ title, description, type: 'info' }),
    };
}
