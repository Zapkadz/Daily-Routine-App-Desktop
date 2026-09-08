import { Modal } from "../../components/Modal";
import { useState } from "react";
import { DeleteConfirmation } from '../../components/DeleteConfirmation';
import { useRoutineStore } from "../../stores/routineStore";
import type { CreateRoutineInput, Routine } from "../../types/routine";
import { RoutineForm } from "./RoutineForm";
import { isRoutineAvailableOnDate, routineOnDate } from '../../services/routineScheduleService';

type RoutineModalProps = { defaultDate: string; routine?: Routine; onClose: () => void; planning?: boolean; onSaved?: (routine: Routine) => void };

export function RoutineModal({ defaultDate, routine, onClose, onSaved }: RoutineModalProps) {
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteRoutine = useRoutineStore(state => state.deleteRoutine);
  const removeDate = useRoutineStore(state => state.removeDate);
  const createRoutine = useRoutineStore((state) => state.createRoutine);
  const updateRoutine = useRoutineStore((state) => state.updateRoutine);

  async function handleSubmit(input: CreateRoutineInput) {
    const saved = routine ? await updateRoutine(routine, input) : await createRoutine(input);
    onSaved?.(saved);
    onClose();
  }

  return (
    <><Modal title={routine ? "Edit routine" : "Create a routine"} description={`Plan activities for ${defaultDate}. Choose a repeating schedule or custom dates.`} onClose={() => { if (!busy) onClose(); }}>
      <RoutineForm defaultDate={defaultDate} routine={routine ? routineOnDate(routine, defaultDate) : undefined} onCancel={onClose} onSubmit={handleSubmit} onBusyChange={setBusy} onDelete={routine ? async () => setConfirmDelete(true) : undefined}
        onRemoveDate={routine && isRoutineAvailableOnDate(routine, defaultDate) ? async () => { await removeDate(routine, defaultDate); onClose(); } : undefined} />
    </Modal>{confirmDelete && routine && <DeleteConfirmation name={`${routine.name} (all dates and history)`} onDelete={async () => { await deleteRoutine(routine); onClose(); }} onClose={() => setConfirmDelete(false)} />}</>
  );
}
