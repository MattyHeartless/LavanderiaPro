export class CalendarComponent {
  currentDate = new Date(); // Fecha actual de referencia
  monthDays: Date[] = [];
  selectedDate: Date = new Date();
today: Date = new Date();
selectedDayLabel: string = 'Mañana, 24 Oct';
  constructor() {
    this.generateMonth();
  }

  generateMonth() {
    this.monthDays = [];
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay());

    for (let i = 0; i < 28; i++) {
      this.monthDays.push(new Date(startDate));
      startDate.setDate(startDate.getDate() + 1);
    }
  }

  changeMonth(offset: number) {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + offset, 1);
    this.generateMonth();
  }

 isPastDay(date: Date): boolean {
  // Creamos copias sin horas para comparar solo el calendario
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const t = new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate());
  return d < t;
}

selectDay(date: Date) {
  // Si el día es pasado, no hacemos nada (bloqueamos la selección)
  if (this.isPastDay(date)) return;
  const options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' };
  const formattedDate = date.toLocaleDateString('es-MX', options);

  // 3. Capitalizamos la primera letra (opcional, para que se vea pro)
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
  this.selectedDayLabel = capitalizedDate;
  this.selectedDate = date;
}

  isSameDay(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString();
  }

  setDayLabel(){
    const date = new Date();
     const options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' };
  const formattedDate = date.toLocaleDateString('es-MX', options);

  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
  this.selectedDayLabel = capitalizedDate;
  }
}
