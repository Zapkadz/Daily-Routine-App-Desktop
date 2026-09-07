import { Modal } from "../../components/Modal";
import { useRoutineStore } from "../../stores/routineStore";
import type { CreateRoutineInput, Routine } from "../../types/routine";
import { RoutineForm } from "./RoutineForm";

type RoutineModalProps = { defaultDate: string; routine?: Routine; onClose: () => void };

export function RoutineModal({ defaultDate, routine, onClose }: RoutineModalProps) {
  const createRoutine = useRoutineStore((state) => state.createRoutine);
  const updateRoutine = useRoutineStore((state) => state.updateRoutine);
  const deleteRoutine = useRoutineStore((state) => state.deleteRoutine);

  async function handleSubmit(input: CreateRoutineInput) {
    if (routine) await updateRoutine(routine, input);
    else await createRoutine(input);
    onClose();
  }

  async function handleDelete() {
    if (!routine) return;
    const confirmed = window.confirm(`Permanently delete “${routine.name}” and its history? This cannot be undone.`);
    if (!confirmed) return;
    await deleteRoutine(routine);
    onClose();
  }

  return (
    <Modal title={routine ? "Edit routine" : "Create a routine"} description="Build a rhythm that fits your real week." onClose={onClose}>
      <RoutineForm defaultDate={defaultDate} routine={routine} onCancel={onClose} onSubmit={handleSubmit} onDelete={routine ? handleDelete : undefined} />
    </Modal>
  );
}
