import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

type ModalProps = {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
};

export function Modal({ title, description, children, onClose }: ModalProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef(document.activeElement as HTMLElement | null);
  const titleId = useId();
  useEffect(() => {
    const previous = trigger.current;
    dialog.current?.showModal?.();
    return () => { dialog.current?.close?.(); previous?.focus(); };
  }, []);
  return createPortal(
      <dialog ref={dialog} className="modal-panel" role="dialog" aria-modal="true" aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); onClose(); }}>
        <header className="modal-header">
          <div>
            <p className="eyebrow">Plan your day</p>
            <h2 id={titleId}>{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <button className="icon-button" type="button" aria-label="Close" onClick={onClose}><X size={18} /></button>
        </header>
        {children}
      </dialog>,
    document.querySelector(".app-frame") ?? document.body,
  );
}
