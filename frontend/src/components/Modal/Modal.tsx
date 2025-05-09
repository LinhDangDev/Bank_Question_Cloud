import { X } from 'lucide-react';
import { useModal } from '@/hooks/useModal';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-3xl',
};

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'lg',
}: ModalProps) => {
  const { renderModal } = useModal({
    onClose,
    closeOnEsc: true,
    closeOnOverlayClick: true,
  });

  const modalContent = (
    <div
      className={`bg-white w-[95%] sm:w-[90%] ${sizeClasses[size]} mx-auto shadow-2xl rounded-lg overflow-hidden m-2 sm:m-4 relative`}
      style={{ maxHeight: 'calc(100vh - 40px)' }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Modal Header */}
      <div className="bg-blue-500 text-white px-4 sm:px-6 py-2 sm:py-3 flex justify-between items-center sticky top-0 z-10">
        <h3 className="font-semibold text-sm sm:text-lg">{title}</h3>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 focus:outline-none text-base sm:text-xl"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Modal Content */}
      <div className="p-3 sm:p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
        {children}
      </div>

      {/* Modal Footer */}
      {footer && (
        <div className="border-t px-4 sm:px-6 py-2 sm:py-3 flex justify-end sticky bottom-0 bg-white z-10">
          {footer}
        </div>
      )}
    </div>
  );

  return renderModal(modalContent);
};
