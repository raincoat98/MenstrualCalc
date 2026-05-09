import React from 'react';
import {View, Text, ScrollView, StyleSheet, Dimensions} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useCycleStore, Symptom, Mood} from '../store/cycleStore';
import {useAppTheme} from '../hooks/useAppTheme';
import {PINK} from '../theme';

const {width: SCREEN_W} = Dimensions.get('window');
const CHART_W = SCREEN_W - 64;

const SYMPTOM_INFO: {key: Symptom; label: string; icon: string; color: string}[] = [
  {key: 'cramps',   label: '복통',    icon: 'lightning-bolt',       color: '#F43F5E'},
  {key: 'headache', label: '두통',    icon: 'head-dots-horizontal', color: '#8B5CF6'},
  {key: 'fatigue',  label: '피로',    icon: 'battery-20',           color: '#F97316'},
  {key: 'backPain', label: '허리통증', icon: 'human',                color: '#10B981'},
  {key: 'bloating', label: '붓기',    icon: 'water-outline',        color: '#3B82F6'},
];

const MOOD_INFO: {key: Mood; emoji: string; label: string; color: string}[] = [
  {key: 'good',      emoji: '😊', label: '좋음',  color: '#10B981'},
  {key: 'neutral',   emoji: '😐', label: '보통',  color: '#6B7280'},
  {key: 'sad',       emoji: '😢', label: '우울',  color: '#3B82F6'},
  {key: 'irritable', emoji: '😡', label: '예민',  color: '#F43F5E'},
  {key: 'tired',     emoji: '😴', label: '피곤',  color: '#8B5CF6'},
];

function daysBetween(a: Date, b: Date): number {
  const da = new Date(a); da.setHours(0,0,0,0);
  const db = new Date(b); db.setHours(0,0,0,0);
  return Math.round(Math.abs(da.getTime() - db.getTime()) / (1000*60*60*24));
}

export default function StatisticsTab() {
  const {C, isDark} = useAppTheme();
  const {records, dayRecords, cycleLength} = useCycleStore();

  const sorted = [...records].sort((a,b) => a.startDate.getTime() - b.startDate.getTime());

  // 주기 길이 계산
  const cycleLengths: {label: string; days: number}[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const days = daysBetween(sorted[i].startDate, sorted[i-1].startDate);
    const d = sorted[i].startDate;
    cycleLengths.push({label: `${d.getMonth()+1}/${d.getDate()}`, days});
  }

  const avg = cycleLengths.length > 0
    ? Math.round(cycleLengths.reduce((s,c) => s+c.days, 0) / cycleLengths.length)
    : cycleLength;
  const minC = cycleLengths.length > 0 ? Math.min(...cycleLengths.map(c=>c.days)) : null;
  const maxC = cycleLengths.length > 0 ? Math.max(...cycleLengths.map(c=>c.days)) : null;

  // 차트 스케일
  const chartMax = maxC ? Math.max(maxC + 4, 40) : 40;
  const chartMin = minC ? Math.max(minC - 4, 18) : 18;
  const CHART_H = 140;
  const barW = cycleLengths.length > 0
    ? Math.min(32, Math.floor((CHART_W - 8) / cycleLengths.length) - 4)
    : 24;

  // 증상 빈도
  const totalDayRec = dayRecords.length;
  const symptomCounts: Record<Symptom, number> = {
    cramps: 0, headache: 0, fatigue: 0, backPain: 0, bloating: 0,
  };
  dayRecords.forEach(r => r.symptoms.forEach(s => { symptomCounts[s]++; }));

  // 감정 분포
  const moodCounts: Record<Mood, number> = {
    good: 0, neutral: 0, sad: 0, irritable: 0, tired: 0,
  };
  dayRecords.forEach(r => { if (r.mood) moodCounts[r.mood]++; });
  const totalMood = Object.values(moodCounts).reduce((s,v) => s+v, 0);

  const cardStyle = [styles.card, {backgroundColor: C.card}];

  if (records.length < 2 && dayRecords.length === 0) {
    return (
      <ScrollView contentContainerStyle={[styles.container, {backgroundColor: C.bg}]}>
        <View style={styles.emptyWrap}>
          <Icon name="chart-bar" size={64} color="#D1A7B8" />
          <Text style={[styles.emptyTitle, {color: C.hint}]}>데이터가 부족해요</Text>
          <Text style={[styles.emptySub, {color: C.hint}]}>생리 기록이 2개 이상 있어야 통계를 볼 수 있어요</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, {backgroundColor: C.bg}]}>

      {/* ── 요약 카드 ── */}
      <Text style={[styles.sectionTitle, {color: C.text}]}>요약</Text>
      <View style={[styles.summaryRow]}>
        <View style={[styles.summaryCard, {backgroundColor: C.card}]}>
          <Text style={[styles.summaryVal, {color: PINK}]}>{avg}일</Text>
          <Text style={[styles.summaryLbl, {color: C.hint}]}>평균 주기</Text>
        </View>
        <View style={[styles.summaryCard, {backgroundColor: C.card}]}>
          <Text style={[styles.summaryVal, {color: '#3B82F6'}]}>{minC ?? '-'}일</Text>
          <Text style={[styles.summaryLbl, {color: C.hint}]}>최단 주기</Text>
        </View>
        <View style={[styles.summaryCard, {backgroundColor: C.card}]}>
          <Text style={[styles.summaryVal, {color: '#F97316'}]}>{maxC ?? '-'}일</Text>
          <Text style={[styles.summaryLbl, {color: C.hint}]}>최장 주기</Text>
        </View>
        <View style={[styles.summaryCard, {backgroundColor: C.card}]}>
          <Text style={[styles.summaryVal, {color: '#10B981'}]}>{records.length}</Text>
          <Text style={[styles.summaryLbl, {color: C.hint}]}>총 기록</Text>
        </View>
      </View>

      {/* ── 주기 길이 추이 ── */}
      {cycleLengths.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, {color: C.text}]}>주기 길이 추이</Text>
          <View style={cardStyle}>
            {/* 평균선 라벨 */}
            <View style={styles.chartLegendRow}>
              <View style={[styles.legendLine, {backgroundColor: PINK}]} />
              <Text style={[styles.legendText, {color: C.hint}]}>평균 {avg}일</Text>
            </View>
            {/* 바 차트 */}
            <View style={[styles.chartArea, {height: CHART_H + 24}]}>
              {/* 평균선 */}
              {(() => {
                const avgRatio = (avg - chartMin) / (chartMax - chartMin);
                const avgY = CHART_H - avgRatio * CHART_H;
                return (
                  <View style={[styles.avgLine, {top: avgY, backgroundColor: PINK + '55'}]} />
                );
              })()}
              {/* 바들 */}
              <View style={styles.barsRow}>
                {cycleLengths.slice(-12).map((c, i) => {
                  const ratio = Math.max(0, Math.min(1, (c.days - chartMin) / (chartMax - chartMin)));
                  const bH = Math.max(8, ratio * CHART_H);
                  const diff = c.days - avg;
                  const barColor = diff > 3 ? '#F97316' : diff < -3 ? '#3B82F6' : '#10B981';
                  return (
                    <View key={i} style={[styles.barWrap, {height: CHART_H}]}>
                      <Text style={[styles.barVal, {color: C.hint}]}>{c.days}</Text>
                      <View style={[styles.bar, {height: bH, width: barW, backgroundColor: barColor, borderRadius: barW/2}]} />
                      <Text style={[styles.barLabel, {color: C.hint, width: barW+8}]} numberOfLines={1}>{c.label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
            {/* 색상 범례 */}
            <View style={styles.colorLegendRow}>
              {[{c:'#3B82F6',l:'짧음'},{c:'#10B981',l:'정상'},{c:'#F97316',l:'길음'}].map(({c,l}) => (
                <View key={l} style={styles.colorLegendItem}>
                  <View style={[styles.colorDot, {backgroundColor: c}]} />
                  <Text style={[styles.legendText, {color: C.hint}]}>{l}</Text>
                </View>
              ))}
            </View>
          </View>
        </>
      )}

      {/* ── 증상 빈도 ── */}
      {totalDayRec > 0 && (
        <>
          <Text style={[styles.sectionTitle, {color: C.text}]}>증상 빈도</Text>
          <View style={cardStyle}>
            {SYMPTOM_INFO.map(s => {
              const count = symptomCounts[s.key];
              const ratio = totalDayRec > 0 ? count / totalDayRec : 0;
              return (
                <View key={s.key} style={styles.symptomRow}>
                  <Icon name={s.icon} size={16} color={s.color} style={{width: 22}} />
                  <Text style={[styles.symptomLabel, {color: C.text}]}>{s.label}</Text>
                  <View style={[styles.barTrack, {backgroundColor: isDark ? '#2a2a42' : '#f0f0f0'}]}>
                    <View style={[styles.barFill, {width: `${ratio*100}%`, backgroundColor: s.color}]} />
                  </View>
                  <Text style={[styles.symptomCount, {color: C.hint}]}>{count}회</Text>
                </View>
              );
            })}
            <Text style={[styles.totalNote, {color: C.hint}]}>총 {totalDayRec}일 기록 기준</Text>
          </View>
        </>
      )}

      {/* ── 감정 분포 ── */}
      {totalMood > 0 && (
        <>
          <Text style={[styles.sectionTitle, {color: C.text}]}>감정 분포</Text>
          <View style={cardStyle}>
            {/* 세그먼트 바 */}
            <View style={styles.moodSegmentBar}>
              {MOOD_INFO.map(m => {
                const ratio = moodCounts[m.key] / totalMood;
                if (ratio === 0) return null;
                return (
                  <View
                    key={m.key}
                    style={[styles.moodSegment, {flex: ratio, backgroundColor: m.color}]}
                  />
                );
              })}
            </View>
            {/* 감정별 상세 */}
            <View style={styles.moodDetailGrid}>
              {MOOD_INFO.map(m => {
                const count = moodCounts[m.key];
                const pct = totalMood > 0 ? Math.round(count/totalMood*100) : 0;
                return (
                  <View key={m.key} style={styles.moodDetailItem}>
                    <Text style={styles.moodEmoji}>{m.emoji}</Text>
                    <Text style={[styles.moodDetailPct, {color: m.color}]}>{pct}%</Text>
                    <Text style={[styles.moodDetailLabel, {color: C.hint}]}>{m.label}</Text>
                    <Text style={[styles.moodDetailCount, {color: C.hint}]}>{count}일</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </>
      )}

      <View style={{height: 40}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {paddingTop: 12, paddingHorizontal: 16, paddingBottom: 40},
  emptyWrap: {alignItems: 'center', paddingTop: 100, gap: 12},
  emptyTitle: {fontSize: 18, fontWeight: '700'},
  emptySub: {fontSize: 13, textAlign: 'center', paddingHorizontal: 32},
  sectionTitle: {fontSize: 15, fontWeight: '700', marginTop: 20, marginBottom: 10},
  card: {
    borderRadius: 16, padding: 16, marginBottom: 4,
    shadowColor: '#000', shadowOffset: {width:0,height:1},
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  summaryRow: {flexDirection: 'row', gap: 8, marginBottom: 4},
  summaryCard: {
    flex: 1, borderRadius: 14, padding: 12, alignItems: 'center',
    shadowColor: '#000', shadowOffset: {width:0,height:1},
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  summaryVal: {fontSize: 22, fontWeight: '800', marginBottom: 4},
  summaryLbl: {fontSize: 11, textAlign: 'center'},
  chartLegendRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 8},
  legendLine: {width: 20, height: 2, borderRadius: 1, marginRight: 6},
  legendText: {fontSize: 11},
  chartArea: {position: 'relative', width: '100%'},
  avgLine: {
    position: 'absolute', left: 0, right: 0, height: 1.5, zIndex: 1,
  },
  barsRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    gap: 4, paddingBottom: 20,
  },
  barWrap: {alignItems: 'center', justifyContent: 'flex-end', flex: 1},
  barVal: {fontSize: 9, marginBottom: 3},
  bar: {},
  barLabel: {fontSize: 9, marginTop: 4, textAlign: 'center'},
  colorLegendRow: {flexDirection: 'row', gap: 16, marginTop: 4},
  colorLegendItem: {flexDirection: 'row', alignItems: 'center', gap: 4},
  colorDot: {width: 8, height: 8, borderRadius: 4},
  symptomRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 12, gap: 8,
  },
  symptomLabel: {fontSize: 13, fontWeight: '500', width: 56},
  barTrack: {flex: 1, height: 10, borderRadius: 5, overflow: 'hidden'},
  barFill: {height: 10, borderRadius: 5},
  symptomCount: {fontSize: 12, width: 28, textAlign: 'right'},
  totalNote: {fontSize: 11, marginTop: 4},
  moodSegmentBar: {
    flexDirection: 'row', height: 18, borderRadius: 9,
    overflow: 'hidden', marginBottom: 16,
  },
  moodSegment: {},
  moodDetailGrid: {flexDirection: 'row', justifyContent: 'space-between'},
  moodDetailItem: {alignItems: 'center', gap: 2},
  moodEmoji: {fontSize: 22},
  moodDetailPct: {fontSize: 14, fontWeight: '700'},
  moodDetailLabel: {fontSize: 11},
  moodDetailCount: {fontSize: 10},
});
