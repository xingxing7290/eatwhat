function pad(n) { return String(n).padStart(2, '0'); }
function dateKey(date) { return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`; }
function parseDateKey(value) {
  const raw = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const [y, m, d] = raw.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
}
function startOfWeek(value = new Date()) {
  const date = value instanceof Date ? new Date(value) : (parseDateKey(value) || new Date());
  date.setHours(0, 0, 0, 0);
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  return dateKey(date);
}
function weekDates(weekStart) {
  const start = parseDateKey(weekStart) || parseDateKey(startOfWeek());
  return Array.from({ length: 7 }, (_, index) => {
    const d = new Date(start);
    d.setDate(start.getDate() + index);
    return dateKey(d);
  });
}
function monthRange(month) {
  const raw = String(month || '').trim();
  const now = new Date();
  const [year, monthNumber] = /^\d{4}-\d{2}$/.test(raw) ? raw.split('-').map(Number) : [now.getFullYear(), now.getMonth() + 1];
  const first = new Date(year, monthNumber - 1, 1);
  const last = new Date(year, monthNumber, 0);
  return { month: `${year}-${pad(monthNumber)}`, start: dateKey(first), end: dateKey(last) };
}
module.exports = { dateKey, parseDateKey, startOfWeek, weekDates, monthRange };
