'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/** Native modal <dialog>. Children mount only while open, so forms reset each time it opens. */
export function ModalDialog({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="m-auto max-h-[90vh] w-[600px] max-w-[94vw] overflow-auto rounded-2xl border border-line p-7 text-foreground backdrop:bg-[#152a35a6]"
    >
      {open && children}
    </dialog>
  );
}
