export class TimestampComposer {
  date(date: Date): string {
    return String(Math.floor(date.getTime() / 1000));
  }

  seconds(amount: number): string {
    return String(amount);
  }

  minutes(amount: number): string {
    return this.seconds(amount * 60);
  }

  hours(amount: number): string {
    return this.minutes(amount * 60);
  }

  days(amount: number): string {
    return this.hours(amount * 24);
  }
}
