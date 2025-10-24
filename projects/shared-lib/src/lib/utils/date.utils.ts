import { formatDate, parseISO } from 'date-fns';
export class DateUtils {
  static readonly DEFAULT_FORMAT = 'yyyy-MM-dd';
  static readonly DISPLAY_FORMAT = 'MMM dd, yyyy';
  static readonly DATETIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';
  static formatForDisplay(date: Date | string): string {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return formatDate(d, this.DISPLAY_FORMAT);
  }
  static formatForApi(date: Date): string {
    return formatDate(date, this.DEFAULT_FORMAT);
  }
  static isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }
  static getDaysDifference(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
