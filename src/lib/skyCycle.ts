export type SkyPhase = 'dawn' | 'morning' | 'noon' | 'sunset' | 'night';

export interface SkyState {
  isDay: boolean;
  phase: SkyPhase;
  phaseLabel: string;
  timeLabel: string;
  progress: number;
  elevation: number;
  starOpacity: number;
  sunWarmth: number;
  skyBackground: string;
}

const DAY_START_HOUR = 5.5; // 05:30
const DAY_END_HOUR = 18.0; // 18:00
const DAY_DURATION = DAY_END_HOUR - DAY_START_HOUR; // 12.5h
const NIGHT_DURATION = 24 - DAY_DURATION; // 11.5h

function clamp01(val: number): number {
  return Math.max(0, Math.min(1, val));
}

export function getOrbitalPercent(
  progress: number,
  xMin: number,
  xMax: number,
  yPeak: number,
  yHorizon: number
): { xPercent: number; yPercent: number; elevation: number } {
  const clamped = clamp01(progress);
  const xPercent = xMin + clamped * (xMax - xMin);
  const elevation = Math.sin(clamped * Math.PI);
  const yPercent = yHorizon - elevation * (yHorizon - yPeak);
  return { xPercent, yPercent, elevation };
}

export function computeSkyState(now: Date = new Date()): SkyState {
  const hours = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const timeLabel = `${hh}:${mm}`;

  const isDay = hours >= DAY_START_HOUR && hours < DAY_END_HOUR;

  let progress = 0;
  let phase: SkyPhase = 'night';
  let phaseLabel = 'MALAM';
  let starOpacity = 0.8;
  let sunWarmth = 0;
  let skyBackground =
    'radial-gradient(ellipse at 50% 18%, rgba(163, 163, 163, 0.08) 0%, rgba(10, 10, 10, 0) 68%)';

  if (isDay) {
    progress = clamp01((hours - DAY_START_HOUR) / DAY_DURATION);

    if (hours < 7.5) {
      phase = 'dawn';
      phaseLabel = 'PAGI // SUNRISE';
      starOpacity = 0.22;
      sunWarmth = 1;
      skyBackground =
        'radial-gradient(ellipse at 24% 48%, rgba(229, 229, 229, 0.12) 0%, rgba(163, 163, 163, 0.05) 42%, rgba(10, 10, 10, 0) 74%)';
    } else if (hours < 10.5) {
      phase = 'morning';
      phaseLabel = 'PAGI';
      starOpacity = 0.04;
      sunWarmth = 0.45;
      skyBackground =
        'radial-gradient(ellipse at 36% 24%, rgba(245, 245, 245, 0.13) 0%, rgba(163, 163, 163, 0.05) 45%, rgba(10, 10, 10, 0) 76%)';
    } else if (hours < 15.0) {
      phase = 'noon';
      phaseLabel = 'SIANG';
      starOpacity = 0;
      sunWarmth = 0;
      skyBackground =
        'radial-gradient(ellipse at 50% 16%, rgba(255, 255, 255, 0.15) 0%, rgba(212, 212, 212, 0.06) 46%, rgba(10, 10, 10, 0) 76%)';
    } else {
      phase = 'sunset';
      phaseLabel = 'SORE // SUNSET';
      starOpacity = 0.24;
      sunWarmth = 1;
      skyBackground =
        'radial-gradient(ellipse at 76% 46%, rgba(212, 212, 212, 0.13) 0%, rgba(115, 115, 115, 0.06) 44%, rgba(10, 10, 10, 0) 74%)';
    }
  } else {
    const nightHours = hours >= DAY_END_HOUR ? hours - DAY_END_HOUR : hours + (24 - DAY_END_HOUR);
    progress = clamp01(nightHours / NIGHT_DURATION);
    phase = 'night';
    phaseLabel = 'MALAM';
    starOpacity = 0.8;
    sunWarmth = 0;
    skyBackground =
      'radial-gradient(ellipse at 50% 18%, rgba(163, 163, 163, 0.08) 0%, rgba(82, 82, 82, 0.03) 48%, rgba(10, 10, 10, 0) 74%)';
  }

  const elevation = Math.sin(progress * Math.PI);

  return {
    isDay,
    phase,
    phaseLabel,
    timeLabel,
    progress,
    elevation,
    starOpacity,
    sunWarmth,
    skyBackground,
  };
}

export function subscribeSkyCycle(
  callback: (state: SkyState) => void,
  intervalMs = 15000
): () => void {
  const notify = () => callback(computeSkyState(new Date()));
  notify();

  const timer = window.setInterval(notify, intervalMs);
  const onVisibility = () => {
    if (!document.hidden) notify();
  };
  document.addEventListener('visibilitychange', onVisibility);

  return () => {
    window.clearInterval(timer);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}
