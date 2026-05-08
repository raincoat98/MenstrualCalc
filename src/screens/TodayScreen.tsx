import React from 'react';
import {View, Text, ScrollView, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useCycleStore} from '../store/cycleStore';
import {PINK} from '../theme';
import {useAppTheme} from '../hooks/useAppTheme';

type DayPhase = 'period' | 'ovulation' | 'fertile' | 'safe' | 'luteal';

interface PhaseInfo {
  label: string;
  icon: string;
  color: string;
  bg: string;
  darkBg: string;
  desc: string;
  foods: string[];
  tips: string[];
}

const PHASE_INFO: Record<DayPhase, PhaseInfo> = {
  period: {
    label: '생리 중',
    icon: 'water',
    color: '#F43F5E',
    bg: '#FFF1F3',
    darkBg: '#2a0d14',
    desc: '몸이 예민한 시기예요. 충분한 휴식을 취하고 무리하지 마세요.',
    foods: ['철분 — 시금치, 소고기, 두부', '마그네슘 — 바나나, 아몬드', '따뜻한 음료 — 생강차, 쑥차'],
    tips: ['가벼운 스트레칭이 생리통 완화에 도움돼요', '카페인과 알코올은 자제하세요', '핫팩으로 아랫배를 따뜻하게 해주세요'],
  },
  ovulation: {
    label: '배란일',
    icon: 'egg',
    color: '#8B5CF6',
    bg: '#F3EEFF',
    darkBg: '#1a0e2e',
    desc: '배란일이에요. 임신 가능성이 가장 높은 날이에요.',
    foods: ['엽산 — 시금치, 브로콜리', '아연 — 굴, 호박씨', '비타민 C — 파프리카, 키위'],
    tips: ['에너지가 가장 높은 날이에요', '중요한 일정이나 운동에 좋아요', '몸 상태를 잘 체크해보세요'],
  },
  fertile: {
    label: '가임기',
    icon: 'sprout',
    color: '#10B981',
    bg: '#ECFDF5',
    darkBg: '#0a1f16',
    desc: '임신 가능성이 있는 시기예요. 정자는 체내에서 최대 5일간 생존해요.',
    foods: ['철분 — 렌틸콩, 두부', '비타민 E — 아몬드, 아보카도', '항산화 — 블루베리, 석류'],
    tips: ['활력이 넘치는 시기예요', '유산소 운동에 좋은 시기예요', '수분 보충을 충분히 해주세요'],
  },
  safe: {
    label: '안전기',
    icon: 'shield-check',
    color: '#3B82F6',
    bg: '#EFF6FF',
    darkBg: '#0a1525',
    desc: '생리 직후로 임신 가능성이 낮은 시기예요. 단, 주기가 불규칙하면 안심할 수 없어요.',
    foods: ['칼슘 — 우유, 치즈', '프로바이오틱스 — 요거트, 김치', '비타민 D — 연어, 달걀'],
    tips: ['몸이 회복되는 시기예요', '새로운 도전이나 계획을 세우기 좋아요', '규칙적인 운동을 시작해보세요'],
  },
  luteal: {
    label: 'PMS 시기',
    icon: 'moon-waning-crescent',
    color: '#F97316',
    bg: '#FFF7ED',
    darkBg: '#1f1206',
    desc: '생리 전 황체기예요. 호르몬 변화로 감정 기복이나 붓기가 나타날 수 있어요.',
    foods: ['마그네슘 — 다크초콜릿, 아몬드', '오메가3 — 연어, 고등어', '비타민 B6 — 닭고기, 감자'],
    tips: ['감정 변화가 생길 수 있어요, 자신에게 너그럽게', '짜고 단 음식은 붓기를 악화시켜요', '충분한 수면이 중요해요'],
  },
};

function getDayPhase(
  date: Date,
  lastPeriod: Date,
  cycleLength: number,
  periodLength: number,
): DayPhase {
  const msPerDay = 1000 * 60 * 60 * 24;
  const d = new Date(date); d.setHours(0, 0, 0, 0);
  const ref = new Date(lastPeriod); ref.setHours(0, 0, 0, 0);
  const daysDiff = Math.round((d.getTime() - ref.getTime()) / msPerDay);
  const dayInCycle = ((daysDiff % cycleLength) + cycleLength) % cycleLength;

  if (dayInCycle < periodLength) return 'period';
  const fertileStart = cycleLength - 19;
  const ovulationDay = cycleLength - 14;
  const fertileEnd = cycleLength - 13;
  if (dayInCycle < fertileStart) return 'safe';
  if (dayInCycle >= fertileStart && dayInCycle <= fertileEnd) {
    return dayInCycle === ovulationDay ? 'ovulation' : 'fertile';
  }
  return 'luteal';
}

function getDayInCycle(date: Date, lastPeriod: Date, cycleLength: number): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const d = new Date(date); d.setHours(0, 0, 0, 0);
  const ref = new Date(lastPeriod); ref.setHours(0, 0, 0, 0);
  const daysDiff = Math.round((d.getTime() - ref.getTime()) / msPerDay);
  return ((daysDiff % cycleLength) + cycleLength) % cycleLength + 1;
}

function getDaysUntilNext(lastPeriod: Date, cycleLength: number): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const ref = new Date(lastPeriod); ref.setHours(0, 0, 0, 0);
  const daysDiff = Math.round((today.getTime() - ref.getTime()) / msPerDay);
  const dayInCycle = ((daysDiff % cycleLength) + cycleLength) % cycleLength;
  return cycleLength - dayInCycle;
}

export default function TodayScreen(): React.JSX.Element {
  const {C, isDark} = useAppTheme();
  const {hasData, lastPeriod, cycleLength, periodLength} = useCycleStore();
  const today = new Date();

  const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const weekday = weekdays[today.getDay()];

  if (!hasData) {
    return (
      <View style={[styles.container, {backgroundColor: C.bg}]}>
        <View style={[styles.header, {backgroundColor: PINK}]}>
          <Icon name="star-circle" size={36} color="#fff" style={{marginBottom: 6}} />
          <Text style={styles.headerTitle}>오늘</Text>
          <Text style={styles.headerDate}>{dateStr} ({weekday})</Text>
        </View>
        <View style={styles.emptyWrap}>
          <Icon name="calendar-question" size={64} color="#F8BBD9" />
          <Text style={[styles.emptyTitle, {color: C.hint}]}>정보가 없어요</Text>
          <Text style={[styles.emptySub, {color: C.hint}]}>계산기 탭에서 먼저 생리 시작일을 입력해주세요</Text>
        </View>
      </View>
    );
  }

  const phase = getDayPhase(today, lastPeriod, cycleLength, periodLength);
  const info = PHASE_INFO[phase];
  const dayInCycle = getDayInCycle(today, lastPeriod, cycleLength);
  const daysUntil = getDaysUntilNext(lastPeriod, cycleLength);
  const cardBg = isDark ? info.darkBg : info.bg;

  return (
    <ScrollView style={[styles.container, {backgroundColor: C.bg}]} contentContainerStyle={styles.content}>
      {/* 헤더 */}
      <View style={[styles.header, {backgroundColor: info.color}]}>
        <Icon name={info.icon} size={40} color="#fff" style={{marginBottom: 8}} />
        <Text style={styles.headerTitle}>오늘</Text>
        <Text style={styles.headerDate}>{dateStr} ({weekday})</Text>
        <View style={styles.phaseBadge}>
          <Text style={[styles.phaseBadgeText, {color: info.color}]}>{info.label}</Text>
        </View>
      </View>

      {/* 주기 요약 카드 */}
      <View style={[styles.summaryCard, {borderColor: info.color, backgroundColor: cardBg}]}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, {color: C.text}]}>{dayInCycle}</Text>
            <Text style={[styles.summaryLabel, {color: C.hint}]}>주기 {dayInCycle}일째</Text>
          </View>
          <View style={[styles.summaryDivider, {backgroundColor: C.border}]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, {color: C.text}]}>{cycleLength}</Text>
            <Text style={[styles.summaryLabel, {color: C.hint}]}>주기 길이</Text>
          </View>
          <View style={[styles.summaryDivider, {backgroundColor: C.border}]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, {color: PINK}]}>{daysUntil}</Text>
            <Text style={[styles.summaryLabel, {color: C.hint}]}>생리까지 D-{daysUntil}</Text>
          </View>
        </View>
      </View>

      {/* 오늘 설명 */}
      <View style={[styles.card, {backgroundColor: C.card, borderColor: info.color}]}>
        <View style={styles.cardTitleRow}>
          <Icon name={info.icon} size={16} color={info.color} style={{marginRight: 6}} />
          <Text style={[styles.cardTitle, {color: info.color}]}>{info.label} 안내</Text>
        </View>
        <Text style={[styles.cardDesc, {color: C.subtext}]}>{info.desc}</Text>
      </View>

      {/* 추천 음식 */}
      <View style={[styles.card, {backgroundColor: C.card, borderColor: info.color}]}>
        <View style={styles.cardTitleRow}>
          <Icon name="food-apple" size={16} color={info.color} style={{marginRight: 6}} />
          <Text style={[styles.cardTitle, {color: info.color}]}>추천 음식</Text>
        </View>
        {info.foods.map((f, i) => (
          <View key={i} style={styles.listRow}>
            <View style={[styles.bullet, {backgroundColor: info.color}]} />
            <Text style={[styles.listText, {color: C.subtext}]}>{f}</Text>
          </View>
        ))}
      </View>

      {/* 오늘의 팁 */}
      <View style={[styles.card, {backgroundColor: C.card, borderColor: info.color}]}>
        <View style={styles.cardTitleRow}>
          <Icon name="lightbulb-outline" size={16} color={info.color} style={{marginRight: 6}} />
          <Text style={[styles.cardTitle, {color: info.color}]}>오늘의 팁</Text>
        </View>
        {info.tips.map((t, i) => (
          <View key={i} style={styles.listRow}>
            <View style={[styles.bullet, {backgroundColor: info.color}]} />
            <Text style={[styles.listText, {color: C.subtext}]}>{t}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  content: {paddingBottom: 40},
  header: {
    paddingTop: 20,
    paddingBottom: 28,
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: {fontSize: 22, fontWeight: '700', color: '#fff'},
  headerDate: {fontSize: 13, color: 'rgba(255,255,255,0.8)'},
  phaseBadge: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 5,
    marginTop: 8,
  },
  phaseBadgeText: {fontSize: 14, fontWeight: '700'},
  summaryCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
  },
  summaryRow: {flexDirection: 'row', alignItems: 'center'},
  summaryItem: {flex: 1, alignItems: 'center'},
  summaryValue: {fontSize: 26, fontWeight: '800'},
  summaryLabel: {fontSize: 11, marginTop: 2, textAlign: 'center'},
  summaryDivider: {width: 1, height: 40},
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTitleRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 10},
  cardTitle: {fontSize: 14, fontWeight: '700'},
  cardDesc: {fontSize: 13, lineHeight: 20},
  listRow: {flexDirection: 'row', alignItems: 'flex-start', marginBottom: 7, gap: 8},
  bullet: {width: 6, height: 6, borderRadius: 3, marginTop: 6},
  listText: {fontSize: 13, flex: 1, lineHeight: 20},
  emptyWrap: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 100},
  emptyTitle: {fontSize: 18, fontWeight: '700'},
  emptySub: {fontSize: 13, textAlign: 'center', paddingHorizontal: 40},
});
