import { useId, useRef, useState } from 'react';
import { IMAGE_ACCEPT, uploadImage } from '@/lib/images';

type ImageFieldProps = {
  label: string;
  value: string | undefined;
  onChange: (url: string | undefined) => void;
  testId: string;
};

/** Upload, preview, replace and remove one image. The stored URL is saved with the content. */
export function ImageField({ label, value, onChange, testId }: ImageFieldProps) {
  const inputId = useId();
  const input = useRef<HTMLInputElement>(null);
  // Always call the newest onChange: the upload is async, and edits made while it runs
  // must not be overwritten by a callback captured when the file was chosen.
  const latestOnChange = useRef(onChange);
  latestOnChange.current = onChange;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const url = await uploadImage(file);
      latestOnChange.current(url);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'The image could not be uploaded.');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div className="admin-field admin-image-field" data-testid={testId}>
      <label htmlFor={inputId}>{label}</label>
      <div className="admin-image-row">
        {value ? (
          <img className="admin-image-preview" src={value} alt="" data-testid={`${testId}-preview`} />
        ) : (
          <div className="admin-image-empty" aria-hidden="true">No image</div>
        )}
        <div className="admin-image-actions">
          <input
            ref={input}
            id={inputId}
            type="file"
            accept={IMAGE_ACCEPT}
            className="admin-file-input"
            disabled={busy}
            onChange={(event) => void pick(event.target.files?.[0])}
            data-testid={`${testId}-file`}
          />
          <button type="button" className="admin-button" disabled={busy} onClick={() => input.current?.click()} data-testid={`${testId}-choose`}>
            {busy ? 'Uploading…' : value ? 'Replace image' : 'Upload image'}
          </button>
          {value && !busy && (
            <button type="button" className="admin-button danger" onClick={() => onChange(undefined)} data-testid={`${testId}-remove`}>
              Remove
            </button>
          )}
        </div>
      </div>
      {error && <p className="admin-error" role="alert" data-testid={`${testId}-error`}>{error}</p>}
      <p className="admin-hint admin-image-hint">PNG, JPEG, WebP or GIF · saved with “Save changes”</p>
    </div>
  );
}
