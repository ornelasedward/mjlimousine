import { useRef, useState } from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { Upload, X } from 'lucide-react';
import { createCallable } from 'react-call';

import type { TFileFieldMeta } from '@documenso/lib/types/field-meta';
import { Button } from '@documenso/ui/primitives/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@documenso/ui/primitives/dialog';

export type SignFieldFileDialogProps = {
  fieldMeta?: TFileFieldMeta;
};

export const SignFieldFileDialog = createCallable<SignFieldFileDialogProps, string | null>(
  ({ call, fieldMeta }) => {
    const { _ } = useLingui();
    const inputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const maxSizeMB = fieldMeta?.maxFileSizeMB ?? 10;
    const allowedTypes = fieldMeta?.allowedFileTypes ?? ['image/*', 'application/pdf'];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setError(null);

      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(_(msg`File size must be less than ${maxSizeMB}MB`));
        return;
      }

      setSelectedFile(file);

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
    };

    const handleSubmit = () => {
      if (!selectedFile) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        call.end(base64);
      };
      reader.readAsDataURL(selectedFile);
    };

    return (
      <Dialog open={true} onOpenChange={(value) => (!value ? call.end(null) : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{fieldMeta?.label || <Trans>Upload File</Trans>}</DialogTitle>
            <DialogDescription>
              <Trans>Please upload your file (e.g., government-issued ID)</Trans>
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 hover:bg-muted/50"
              onClick={() => inputRef.current?.click()}
            >
              {preview ? (
                <img src={preview} alt="Preview" className="max-h-40 max-w-full object-contain" />
              ) : selectedFile ? (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-foreground">{selectedFile.name}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    <Trans>Click to select a file</Trans>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <Trans>Images or PDF, up to {maxSizeMB}MB</Trans>
                  </p>
                </div>
              )}
            </div>

            {selectedFile && (
              <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2">
                <span className="max-w-[200px] truncate text-sm">{selectedFile.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreview(null);
                    if (inputRef.current) inputRef.current.value = '';
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}

            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept={allowedTypes.join(',')}
              onChange={handleFileChange}
            />
          </div>

          <DialogFooter>
            <div className="mt-4 flex w-full flex-1 flex-nowrap gap-4">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => call.end(null)}
              >
                <Trans>Cancel</Trans>
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={!selectedFile}
                onClick={handleSubmit}
              >
                <Trans>Upload</Trans>
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
);
