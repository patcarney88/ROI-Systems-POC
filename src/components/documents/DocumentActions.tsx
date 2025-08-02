/**
 * Document Actions Component
 * Designed by: Frontend Specialist + UX Designer
 * 
 * Action buttons for document operations
 */

import React from 'react';
import {
  EyeIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  PencilIcon,
  ShareIcon
} from '@heroicons/react/24/outline';

interface Document {
  id: string;
  permissions: {
    can_view: boolean;
    can_edit: boolean;
    can_delete: boolean;
    can_share: boolean;
  };
}

interface DocumentActionsProps {
  document: Document;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  size?: 'sm' | 'md';
}

export const DocumentActions: React.FC<DocumentActionsProps> = ({
  document,
  onView,
  onEdit,
  onDelete,
  onDownload,
  onShare,
  size = 'sm'
}) => {
  const iconClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const buttonClass = size === 'sm' ? 'p-1' : 'p-2';

  return (
    <div className="flex items-center gap-1">
      {document.permissions.can_view && onView && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
          className={`${buttonClass} text-gray-400 hover:text-gray-600 transition-colors`}
          title="View document"
        >
          <EyeIcon className={iconClass} />
        </button>
      )}
      
      {document.permissions.can_edit && onEdit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className={`${buttonClass} text-gray-400 hover:text-gray-600 transition-colors`}
          title="Edit document"
        >
          <PencilIcon className={iconClass} />
        </button>
      )}
      
      {onDownload && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDownload();
          }}
          className={`${buttonClass} text-gray-400 hover:text-gray-600 transition-colors`}
          title="Download document"
        >
          <ArrowDownTrayIcon className={iconClass} />
        </button>
      )}
      
      {document.permissions.can_share && onShare && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShare();
          }}
          className={`${buttonClass} text-gray-400 hover:text-gray-600 transition-colors`}
          title="Share document"
        >
          <ShareIcon className={iconClass} />
        </button>
      )}
      
      {document.permissions.can_delete && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className={`${buttonClass} text-gray-400 hover:text-red-600 transition-colors`}
          title="Delete document"
        >
          <TrashIcon className={iconClass} />
        </button>
      )}
    </div>
  );
};