let notifee: any = null;
let TriggerType: any = null;
let AndroidImportance: any = null;

try {
  const mod = require('@notifee/react-native');
  notifee = mod.default;
  TriggerType = mod.TriggerType;
  AndroidImportance = mod.AndroidImportance;
} catch {}

const CHANNEL_ID = 'menstrual-cycle';

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function at9am(date: Date): Date {
  const d = new Date(date);
  d.setHours(9, 0, 0, 0);
  return d;
}

async function ensureChannel() {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: '월경 주기 알림',
    importance: AndroidImportance.HIGH,
  });
}

export async function requestPermission() {
  try {
    if (!notifee) return;
    await notifee.requestPermission();
  } catch {}
}

export async function scheduleNotifications(
  lastPeriod: Date,
  cycleLength: number,
  settings: {
    notiPeriod: boolean;
    notiPeriodDays: number;
    notiFertile: boolean;
    notiOvulation: boolean;
  },
) {
  try {
    if (!notifee) return;
    await ensureChannel();
    await notifee.cancelAllNotifications();

    const now = new Date();
    const nextPeriod = addDays(lastPeriod, cycleLength);
    const ovulation = addDays(nextPeriod, -14);
    const fertileStart = addDays(ovulation, -5);

    if (settings.notiPeriod) {
      const trigger = at9am(addDays(nextPeriod, -settings.notiPeriodDays));
      if (trigger > now) {
        await notifee.createTriggerNotification(
          {
            id: 'period-alert',
            title: '생리 예정 알림 💧',
            body: `${settings.notiPeriodDays}일 후 생리가 시작될 예정이에요`,
            android: {channelId: CHANNEL_ID, importance: AndroidImportance.HIGH},
          },
          {type: TriggerType.TIMESTAMP, timestamp: trigger.getTime()},
        );
      }
    }

    if (settings.notiFertile) {
      const trigger = at9am(fertileStart);
      if (trigger > now) {
        await notifee.createTriggerNotification(
          {
            id: 'fertile-alert',
            title: '가임기 시작 🌱',
            body: '오늘부터 가임기가 시작돼요',
            android: {channelId: CHANNEL_ID, importance: AndroidImportance.HIGH},
          },
          {type: TriggerType.TIMESTAMP, timestamp: trigger.getTime()},
        );
      }
    }

    if (settings.notiOvulation) {
      const trigger = at9am(ovulation);
      if (trigger > now) {
        await notifee.createTriggerNotification(
          {
            id: 'ovulation-alert',
            title: '배란일 알림 🥚',
            body: '오늘은 배란일이에요. 임신 가능성이 가장 높은 날이에요',
            android: {channelId: CHANNEL_ID, importance: AndroidImportance.HIGH},
          },
          {type: TriggerType.TIMESTAMP, timestamp: trigger.getTime()},
        );
      }
    }
  } catch {}
}

export async function cancelAllNotifications() {
  try {
    if (!notifee) return;
    await notifee.cancelAllNotifications();
  } catch {}
}
