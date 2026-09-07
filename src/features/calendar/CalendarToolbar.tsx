import { ChevronLeft, ChevronRight } from "lucide-react";

type CalendarToolbarProps = {
  label: string;
  onPrevious: () => void;
  onToday: () => void;
  onNext: () => void;
};

export function CalendarToolbar({ label, onPrevious, onToday, onNext }: CalendarToolbarProps) {
  return (
    <div className="calendar-toolbar">
      <strong>{label}</strong>
      <div className="header-actions">
        <button className="icon-button" type="button" aria-label="Previous period" onClick={onPrevious}><ChevronLeft size={18} /></button>
        <button className="today-button" type="button" onClick={onToday}>Today</button>
        <button className="icon-button" type="button" aria-label="Next period" onClick={onNext}><ChevronRight size={18} /></button>
      </div>
    </div>
  );
}
