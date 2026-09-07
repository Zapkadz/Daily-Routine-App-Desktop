import { Modal } from "../../components/Modal";
import { useState } from "react";
import { DeleteConfirmation } from "../../components/DeleteConfirmation";
import { useRoutineStore } from "../../stores/routineStore";
import type { CreateRoutineInput, Routine } from "../../types/routine";
import { RoutineForm } from "./RoutineForm";

type RoutineModalProps = { defaultDate: string; routine?: Routine; onClose: () => void; planning?: boolean; onSaved?: (routine: Routine) => void };

export function RoutineModal({ defaultDate, routine, onClose, planning = false, onSaved }: RoutineModalProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const createRoutine = useRoutineStore((state) => state.createRoutine);
  const updateRoutine = useRoutineStore((state) => state.updateRoutine);
  const deleteRoutine = useRoutineStore((state) => state.deleteRoutine);

  async function handleSubmit(input: CreateRoutineInput) {
    const saved = routine ? await updateRoutine(routine, input) : await createRoutine(input);
    onSaved?.(saved);
    onClose();
  }

  async function handleDelete() {
    if (!routine) return;
    await deleteRoutine(routine);
    onClose();
  }

  return (
    <><Modal title={routine ? "Edit routine" : "Create a routine"} description={planning ? (routine ? 'You are editing the repeating routine, including its schedule on other days.' : `Starts on ${defaultDate}. This routine repeats according to its schedule.`) : "Build a rhythm that fits your real week."} onClose={onClose}>
      <RoutineForm defaultDate={defaultDate} routine={routine} onCancel={onClose} onSubmit={handleSubmit} onDelete={routine ? async () => setConfirmDelete(true) : undefined} />
    </Modal>{confirmDelete && routine && <DeleteConfirmation name={routine.name} onDelete={handleDelete} onClose={() => setConfirmDelete(false)} />}</>
  );
}
