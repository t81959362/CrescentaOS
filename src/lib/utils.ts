import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatTime = (seconds: number): string => {
  if (seconds === Infinity || isNaN(seconds)) {
    return ''; // Or some other placeholder like 'N/A'
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  
  let timeString = '';
  if (h > 0) {
    timeString += `${h}h `;
  }
  if (m > 0 || h === 0) { // Show minutes if hours is 0 or if there are minutes
    timeString += `${m}m`;
  }
  return timeString.trim() || '0m'; // Ensure something is returned, e.g., '0m' if less than a minute
};

export function formatDate(date: Date): { timeString: string; dateString: string } {
  const timeString = date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  
  const dateString = date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });
  
  return { timeString, dateString };
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function getRandomPosition(maxWidth: number, maxHeight: number) {
  const width = 600;
  const height = 400;
  
  const maxX = Math.max(50, maxWidth - width - 50);
  const maxY = Math.max(50, maxHeight - height - 50);
  
  return {
    x: Math.floor(Math.random() * maxX) + 50,
    y: Math.floor(Math.random() * maxY) + 50,
    width,
    height,
  };
}

export function getCenteredPosition(maxWidth: number, maxHeight: number) {
  const width = 600;
  const height = 400;

  return {
    x: Math.max(0, Math.floor((maxWidth - width) / 2)),
    y: Math.max(0, Math.floor((maxHeight - height) / 2)),
    width,
    height,
  };
}