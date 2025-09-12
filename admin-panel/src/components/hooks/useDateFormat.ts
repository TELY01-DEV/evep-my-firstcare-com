import { useMemo } from 'react';

export const useDateFormat = (date: string | Date) => {
  return useMemo(() => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [date]);
};
