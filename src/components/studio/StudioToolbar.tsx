'use client';

import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  selectIsDirty,
  selectIsSaving,
  selectUser,
  selectIsPublishing,
  selectLatestRelease,
} from '@/store/selectors';
import { hasPermission } from '@/types/auth';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface StudioToolbarProps {
  onSave?: () => void;
  onPublish?: () => void;
}

export function StudioToolbar({ onSave, onPublish }: StudioToolbarProps) {
  const dispatch = useAppDispatch();
  void dispatch; // available for future actions

  const user = useAppSelector(selectUser);
  const isDirty = useAppSelector(selectIsDirty);
  const isSaving = useAppSelector(selectIsSaving);
  const isPublishing = useAppSelector(selectIsPublishing);
  const latestRelease = useAppSelector(selectLatestRelease);

  const canEdit = user ? hasPermission(user.role, 'page:edit') : false;
  const canPublish = user ? hasPermission(user.role, 'page:publish') : false;

  return (
    <div
      role="toolbar"
      aria-label="Studio toolbar"
      className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2"
    >
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-gray-900">Page Studio</span>
        {latestRelease && (
          <Badge variant="info">v{latestRelease.version}</Badge>
        )}
        {isDirty && (
          <Badge variant="warning">Unsaved changes</Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        {canEdit && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onSave}
            disabled={!isDirty || isSaving}
            aria-busy={isSaving}
          >
            {isSaving ? 'Saving…' : 'Save draft'}
          </Button>
        )}

        {canPublish && (
          <Button
            variant="primary"
            size="sm"
            onClick={onPublish}
            disabled={isDirty || isPublishing}
            aria-busy={isPublishing}
          >
            {isPublishing ? 'Publishing…' : 'Publish'}
          </Button>
        )}

        {user && (
          <span className="ml-4 text-xs text-gray-500">
            {user.name} · {user.role}
          </span>
        )}
      </div>
    </div>
  );
}
