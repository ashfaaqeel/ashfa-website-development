import { useEffect, useState } from 'react';

const TIME_ZONE = 'Asia/Kolkata';
const formatter = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
});

/** Live clock in India Standard Time. Ticks every second and cleans up on unmount. */
export function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <time className="live-clock" dateTime={now.toISOString()} data-testid="text-footer-time">
      {formatter.format(now)} IST
    </time>
  );
}
