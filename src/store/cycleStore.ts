import {create} from 'zustand';

export interface PeriodRecord {
  id: string;
  startDate: Date;
}

interface CycleState {
  lastPeriod: Date;
  cycleLength: number;
  periodLength: number;
  hasData: boolean;
  records: PeriodRecord[];
  notiPeriod: boolean;
  notiPeriodDays: number;
  notiFertile: boolean;
  notiOvulation: boolean;
  setLastPeriod: (date: Date) => void;
  setCycleLength: (n: number) => void;
  setPeriodLength: (n: number) => void;
  setNotiPeriod: (v: boolean) => void;
  setNotiPeriodDays: (v: number) => void;
  setNotiFertile: (v: boolean) => void;
  setNotiOvulation: (v: boolean) => void;
  apply: (lastPeriod: Date, cycleLength: number, periodLength: number) => void;
  addRecord: (date: Date) => void;
  deleteRecord: (id: string) => void;
  reset: () => void;
}

export const useCycleStore = create<CycleState>((set, get) => ({
  lastPeriod: new Date(),
  cycleLength: 28,
  periodLength: 5,
  hasData: false,
  records: [],
  notiPeriod: false,
  notiPeriodDays: 3,
  notiFertile: false,
  notiOvulation: false,
  setLastPeriod: date => set({lastPeriod: date}),
  setCycleLength: n => set({cycleLength: n}),
  setPeriodLength: n => set({periodLength: n}),
  setNotiPeriod: v => set({notiPeriod: v}),
  setNotiPeriodDays: v => set({notiPeriodDays: v}),
  setNotiFertile: v => set({notiFertile: v}),
  setNotiOvulation: v => set({notiOvulation: v}),
  apply: (lastPeriod, cycleLength, periodLength) =>
    set({lastPeriod, cycleLength, periodLength, hasData: true}),
  addRecord: date => {
    const fmt = (d: Date) => d.toDateString();
    const already = get().records.some(r => fmt(r.startDate) === fmt(date));
    if (already) return;
    const record: PeriodRecord = {id: Date.now().toString(), startDate: date};
    const records = [record, ...get().records].sort(
      (a, b) => b.startDate.getTime() - a.startDate.getTime(),
    );
    set({records, lastPeriod: records[0].startDate, hasData: true});
  },
  deleteRecord: id =>
    set(s => ({records: s.records.filter(r => r.id !== id)})),
  reset: () =>
    set({lastPeriod: new Date(), cycleLength: 28, periodLength: 5, hasData: false, records: []}),
}));
