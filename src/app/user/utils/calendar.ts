export class CalendarComponent {
  currentDate = new Date(); // Fecha actual de referencia
  weekDays: Date[] = [];
  selectedDate: Date = new Date();
today: Date = new Date();
selectedDayLabel: string = 'Mañana, 24 Oct';
  constructor() {
    this.generateWeek();
  }

  generateWeek() {
    this.weekDays = [];
    // Buscamos el domingo de la semana actual
    const startOfWeek = new Date(this.currentDate);
    const day = startOfWeek.getDay() ; // 0 es Domingo
    startOfWeek.setDate(this.currentDate.getDate() - day);

    // Llenamos el arreglo con los 7 días
    for (let i = 0; i < 7; i++) {
      this.weekDays.push(new Date(startOfWeek));
      startOfWeek.setDate(startOfWeek.getDate() + 1);
    }
  }

  changeWeek(offset: number) {
    // offset será 7 para siguiente semana, -7 para anterior
    this.currentDate.setDate(this.currentDate.getDate() + offset);
    this.generateWeek();
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
}