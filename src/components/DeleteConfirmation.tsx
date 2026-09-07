import { useState } from "react";
import { Button } from "./Button";
import { Modal } from "./Modal";

export function DeleteConfirmation({ name, onDelete, onClose }: { name: string; onDelete: () => Promise<void>; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function remove() {
    if (busy) return;
    setBusy(true);
    try { await onDelete(); } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to delete. Try again.");
      setBusy(false);
    }
  }
  return <Modal title="Delete permanently?" description={`Delete “${name}” and its associated history? This cannot be undone.`} onClose={() => { if (!busy) onClose(); }}>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="form-actions">
      <Button autoFocus variant="secondary" disabled={busy} onClick={onClose}>Cancel</Button>
      <Button className="delete-solid" disabled={busy} aria-busy={busy} onClick={() => void remove()}>{busy ? "Deleting…" : "Delete permanently"}</Button>
    </div>
  </Modal>;
}
