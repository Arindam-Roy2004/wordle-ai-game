import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type HTMLAttributes,
  type SVGProps,
} from 'react';
import './Timer.css';

type TimerVariant = 'default' | 'outline' | 'ghost' | 'destructive';
type TimerSize = 'sm' | 'md' | 'lg';

type TimerRootProps = HTMLAttributes<HTMLDivElement> & {
  variant?: TimerVariant;
  size?: TimerSize;
  loading?: boolean;
  warning?: boolean;
};

type TimerIconProps = {
  size?: TimerSize;
  loading?: boolean;
  warning?: boolean;
  className?: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
};

type TimerDisplayProps = {
  time?: string;
  size?: TimerSize;
  className?: string;
};

type TimerProps = TimerRootProps & {
  time?: string;
};

type UseTimerOptions = {
  initialTime?: number;
  interval?: number;
  format?: 'MM:SS' | 'HH:MM:SS';
  autoStart?: boolean;
};

type FormattedTime = {
  hours: string;
  minutes: string;
  seconds: string;
  display: string;
};

const joinClasses = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

function ClockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M9 2h6" />
      <g className="retro-timer__icon-hands">
        <path d="M12 12V7" />
        <path d="M12 12l3 2" />
      </g>
    </svg>
  );
}

function formatTimerValue(totalSeconds: number, format: 'MM:SS' | 'HH:MM:SS'): FormattedTime {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const paddedHours = hours.toString().padStart(2, '0');
  const paddedMinutes = minutes.toString().padStart(2, '0');
  const paddedSeconds = seconds.toString().padStart(2, '0');

  return {
    hours: paddedHours,
    minutes: paddedMinutes,
    seconds: paddedSeconds,
    display: format === 'HH:MM:SS'
      ? `${paddedHours}:${paddedMinutes}:${paddedSeconds}`
      : `${(hours * 60 + minutes).toString().padStart(2, '0')}:${paddedSeconds}`,
  };
}

export function useTimer({
  initialTime = 0,
  interval = 1000,
  format = 'MM:SS',
  autoStart = false,
}: UseTimerOptions = {}) {
  const [time, setTime] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(autoStart);

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setTime((currentTime) => currentTime + 1);
    }, interval);

    return () => window.clearInterval(intervalId);
  }, [interval, isRunning]);

  const start = useCallback(() => setIsRunning(true), []);
  const stop = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setIsRunning(false);
    setTime(initialTime);
  }, [initialTime]);

  const formattedTime = useMemo(() => formatTimerValue(time, format), [format, time]);

  return {
    time,
    setTime,
    isRunning,
    start,
    stop,
    reset,
    formattedTime,
  };
}

export function TimerRoot({
  className,
  variant = 'default',
  size = 'md',
  loading = false,
  warning = false,
  children,
  ...props
}: TimerRootProps) {
  return (
    <div
      className={joinClasses(
        'retro-timer',
        `retro-timer--${variant}`,
        `retro-timer--${size}`,
        loading && 'retro-timer--loading',
        warning && 'retro-timer--warning',
        className,
      )}
      role="timer"
      aria-live="polite"
      {...props}
    >
      {children}
    </div>
  );
}

export function TimerIcon({
  size = 'md',
  loading = false,
  warning = false,
  className,
  icon: Icon = ClockIcon,
}: TimerIconProps) {
  return (
    <div
      className={joinClasses(
        'retro-timer__icon',
        `retro-timer__icon--${size}`,
        loading && 'retro-timer__icon--loading',
        warning && 'retro-timer__icon--warning',
        className,
      )}
      aria-hidden="true"
    >
      <Icon className="retro-timer__icon-svg" />
    </div>
  );
}

export function TimerDisplay({
  time = '00:00',
  size = 'md',
  className,
}: TimerDisplayProps) {
  return (
    <div className={joinClasses('retro-timer__display', `retro-timer__display--${size}`, className)}>
      <span className="retro-timer__time">{time}</span>
    </div>
  );
}

export function Timer({
  time = '00:00',
  variant = 'default',
  size = 'md',
  loading = false,
  warning = false,
  className,
  ...props
}: TimerProps) {
  return (
    <TimerRoot
      variant={variant}
      size={size}
      loading={loading}
      warning={warning}
      className={className}
      {...props}
    >
      <TimerIcon size={size} loading={loading} warning={warning} />
      <TimerDisplay time={time} size={size} />
    </TimerRoot>
  );
}
