type ProgressRingProps = {
  value: number;
  size?: number;
};

export function ProgressRing({ value, size = 44 }: ProgressRingProps) {
  const normalizedValue = Math.min(100, Math.max(0, value));
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (normalizedValue / 100) * circumference;

  return (
    <div className="progress-ring" style={{ width: size, height: size }} aria-label={`${normalizedValue}% complete`}>
      <svg width={size} height={size} viewBox="0 0 44 44" aria-hidden="true">
        <circle className="progress-track" cx="22" cy="22" r={radius} />
        <circle
          className="progress-value"
          cx="22"
          cy="22"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <span>{normalizedValue}%</span>
    </div>
  );
}
