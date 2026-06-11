'use client';

import { useCallback, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ACCEPTED_MIME_TYPES, FILE_SIZE_MAX_BYTES } from '@/lib/types';
import { cn } from '@/lib/cn';

export function FileUploader({
  file,
  onSelect,
  onError,
}: {
  file: File | null;
  onSelect: (f: File | null) => void;
  onError: (key: 'tooLarge' | 'badType') => void;
}) {
  const t = useTranslations('analyze.upload');
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const validateAndSet = useCallback(
    (f: File) => {
      if (!ACCEPTED_MIME_TYPES.includes(f.type)) {
        onError('badType');
        return;
      }
      if (f.size > FILE_SIZE_MAX_BYTES) {
        onError('tooLarge');
        return;
      }
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return f.type.startsWith('image/') ? URL.createObjectURL(f) : null;
      });
      onSelect(f);
    },
    [onSelect, onError],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files?.[0];
      if (f) validateAndSet(f);
    },
    [validateAndSet],
  );

  function clear() {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    onSelect(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_MIME_TYPES.join(',')}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) validateAndSet(f);
        }}
      />

      {!file ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-colors',
            dragging
              ? 'border-primary bg-blue-50'
              : 'border-border bg-white hover:border-slate-300',
          )}
        >
          <span className="text-4xl">📋</span>
          <span className="mt-4 font-semibold text-foreground">
            {t('title')}
          </span>
          <span className="mt-1 text-sm text-muted">{t('subtitle')}</span>
          <span className="mt-4 text-xs text-muted">{t('formats')}</span>
        </button>
      ) : (
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-white p-4">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt={file.name}
              className="h-16 w-16 rounded-lg object-cover"
            />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-100 text-2xl">
              📄
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {file.name}
            </p>
            <p className="text-xs text-muted">
              {(file.size / (1024 * 1024)).toFixed(1)} MB
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-sm font-medium text-primary hover:underline"
            >
              {t('change')}
            </button>
            <button
              type="button"
              onClick={clear}
              className="text-sm font-medium text-muted hover:text-status-urgent"
            >
              {t('remove')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
