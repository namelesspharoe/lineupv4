import { AlertCircle, X } from 'lucide-react';
import { ResponsiveModalPanel } from '../../../common/ResponsiveModalPanel';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export function ConfirmationModal({ isOpen, onClose, onConfirm, title, message }: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <ResponsiveModalPanel onClose={onClose} labelledBy="confirmation-modal-title" maxWidthClass="sm:max-w-md">
      <div className="flex shrink-0 items-center justify-end border-b border-gray-200 bg-white px-2 py-2 dark:border-gray-800 dark:bg-gray-900 sm:absolute sm:inset-x-0 sm:top-0 sm:z-20 sm:border-0 sm:bg-transparent sm:px-4 sm:py-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pb-6 pt-2 sm:px-6 sm:pb-6 sm:pt-16">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-full bg-red-100 p-2 dark:bg-red-950/50">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 id="confirmation-modal-title" className="text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>

        <p className="mb-6 text-gray-600 dark:text-gray-400">{message}</p>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg px-4 py-2.5 text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 sm:w-auto sm:py-2"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-white transition-colors hover:bg-red-700 sm:w-auto sm:py-2"
          >
            Remove Student
          </button>
        </div>
      </div>
    </ResponsiveModalPanel>
  );
}
