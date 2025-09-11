import { Weeks } from '../models/organisationservicetiming.model';

/**
 * Utility functions for day-of-week operations using the Weeks enum
 */
export class DayOfWeekUtil {
  /**
   * Convert .NET DayOfWeek (Sunday=0) to our Weeks enum (Monday=1)
   */
  static fromDotNetDayOfWeek(dayOfWeek: number): Weeks {
    return ((dayOfWeek + 6) % 7) + 1 as Weeks;
  }

  /**
   * Convert our Weeks enum to .NET DayOfWeek (Sunday=0)
   */
  static toDotNetDayOfWeek(weeks: Weeks): number {
    return ((weeks - 1 + 1) % 7);
  }

  /**
   * Get day name from Weeks enum
   */
  static getDayName(weeks: Weeks): string {
    const dayNames = {
      [Weeks.Monday]: 'Monday',
      [Weeks.Tuesday]: 'Tuesday',
      [Weeks.Wednesday]: 'Wednesday',
      [Weeks.Thursday]: 'Thursday',
      [Weeks.Friday]: 'Friday',
      [Weeks.Saturday]: 'Saturday',
      [Weeks.Sunday]: 'Sunday',
    };
    return dayNames[weeks] || `Day ${weeks}`;
  }

  /**
   * Get day name from day number (using our Weeks enum format)
   */
  static getDayNameFromNumber(dayNumber: number): string {
    return this.getDayName(dayNumber as Weeks);
  }

  /**
   * Get all days of week in order
   */
  static getAllDays(): Array<{ id: Weeks; label: string }> {
    return [
      { id: Weeks.Monday, label: 'Monday' },
      { id: Weeks.Tuesday, label: 'Tuesday' },
      { id: Weeks.Wednesday, label: 'Wednesday' },
      { id: Weeks.Thursday, label: 'Thursday' },
      { id: Weeks.Friday, label: 'Friday' },
      { id: Weeks.Saturday, label: 'Saturday' },
      { id: Weeks.Sunday, label: 'Sunday' },
    ];
  }

  /**
   * Check if a day number is valid for our Weeks enum
   */
  static isValidDayNumber(dayNumber: number): boolean {
    return dayNumber >= Weeks.Monday && dayNumber <= Weeks.Sunday;
  }
}
