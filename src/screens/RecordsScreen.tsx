import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import DateTimePicker, {DateTimePickerEvent} from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import {useCycleStore, PeriodRecord, Symptom, Mood} from '../store/cycleStore';
import {PINK, PINK_LIGHT} from '../theme';
import {useAppTheme} from '../hooks/useAppTheme';
import StatisticsTab from '../components/StatisticsTab';

function formatDate(date: Date): string {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function formatDateShort(date: Date): string {
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function daysAgo(date: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.round((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function daysBetween(a: Date, b: Date): number {
  const da = new Date(a); da.setHours(0, 0, 0, 0);
  const db = new Date(b); db.setHours(0, 0, 0, 0);
  return Math.round(Math.abs(da.getTime() - db.getTime()) / (1000 * 60 * 60 * 24));
}

function avgCycle(records: PeriodRecord[]): number | null {
  if (records.length < 2) return null;
  const sorted = [...records].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  let total = 0;
  for (let i = 1; i < sorted.length; i++) {
    total += daysBetween(sorted[i].startDate, sorted[i - 1].startDate);
  }
  return Math.round(total / (sorted.length - 1));
}

const SYMPTOMS: {key: Symptom; label: string; icon: string; color: string}[] = [
  {key: 'cramps',    label: '복통',    icon: 'lightning-bolt',        color: '#F43F5E'},
  {key: 'headache',  label: '두통',    icon: 'head-dots-horizontal',  color: '#8B5CF6'},
  {key: 'fatigue',   label: '피로',    icon: 'battery-20',            color: '#F97316'},
  {key: 'backPain',  label: '허리통증', icon: 'human',                 color: '#10B981'},
  {key: 'bloating',  label: '붓기',    icon: 'water-outline',         color: '#3B82F6'},
];

const MOODS: {key: Mood; emoji: string; label: string; color: string}[] = [
  {key: 'good',      emoji: '😊', label: '좋음',  color: '#10B981'},
  {key: 'neutral',   emoji: '😐', label: '보통',  color: '#6B7280'},
  {key: 'sad',       emoji: '😢', label: '우울',  color: '#3B82F6'},
  {key: 'irritable', emoji: '😡', label: '예민',  color: '#F43F5E'},
  {key: 'tired',     emoji: '😴', label: '피곤',  color: '#8B5CF6'},
];

export default function RecordsScreen(): React.JSX.Element {
  const {C, isDark} = useAppTheme();
  const {records, addRecord, deleteRecord, dayRecords, addDayRecord, deleteDayRecord} = useCycleStore();

  // 탭
  const [tab, setTab] = useState<'period' | 'symptoms' | 'stats'>('period');

  // 생리 기록용
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tempDate, setTempDate] = useState(new Date());

  // 증상/감정 기록용
  const [showDayModal, setShowDayModal] = useState(false);
  const [dayDate, setDayDate] = useState(new Date());
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [tempDayDate, setTempDayDate] = useState(new Date());
  const [selectedSymptoms, setSelectedSymptoms] = useState<Symptom[]>([]);
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);

  const avg = avgCycle(records);
  const sortedPeriod = [...records].sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

  const onPeriodDateChange = (_: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowPeriodPicker(false);
      if (date) {
        const exists = records.some(r => formatDate(r.startDate) === formatDate(date));
        if (exists) { Alert.alert('중복', '이미 같은 날짜의 기록이 있어요.'); return; }
        addRecord(date);
        Toast.show({type: 'success', text1: '기록이 추가됐어요', visibilityTime: 1800});
      }
    } else {
      if (date) setTempDate(date);
    }
  };

  const confirmPeriodAdd = () => {
    const dateToAdd = Platform.OS === 'ios' ? tempDate : selectedDate;
    const exists = records.some(r => formatDate(r.startDate) === formatDate(dateToAdd));
    if (exists) { Alert.alert('중복', '이미 같은 날짜의 기록이 있어요.'); return; }
    addRecord(dateToAdd);
    setShowPeriodPicker(false);
    Toast.show({type: 'success', text1: '기록이 추가됐어요', visibilityTime: 1800});
  };

  const confirmPeriodDelete = (record: PeriodRecord) => {
    Alert.alert('기록 삭제', `${formatDate(record.startDate)} 기록을 삭제할까요?`, [
      {text: '취소', style: 'cancel'},
      {text: '삭제', style: 'destructive', onPress: () => {
        deleteRecord(record.id);
        Toast.show({type: 'error', text1: '기록이 삭제됐어요', visibilityTime: 1800});
      }},
    ]);
  };

  const openDayModal = () => {
    const today = new Date();
    setDayDate(today);
    setTempDayDate(today);
    const existing = dayRecords.find(r => formatDate(r.date) === formatDate(today));
    setSelectedSymptoms(existing?.symptoms ?? []);
    setSelectedMood(existing?.mood ?? null);
    setShowDayModal(true);
  };

  const onDayDateChange = (_: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDayPicker(false);
      if (date) {
        setDayDate(date);
        const existing = dayRecords.find(r => formatDate(r.date) === formatDate(date));
        setSelectedSymptoms(existing?.symptoms ?? []);
        setSelectedMood(existing?.mood ?? null);
      }
    } else {
      if (date) setTempDayDate(date);
    }
  };

  const saveDayRecord = () => {
    if (selectedSymptoms.length === 0 && selectedMood === null) {
      Alert.alert('입력 필요', '증상이나 감정을 하나 이상 선택해주세요.');
      return;
    }
    addDayRecord(dayDate, selectedSymptoms, selectedMood);
    setShowDayModal(false);
    Toast.show({type: 'success', text1: '기록이 저장됐어요', visibilityTime: 1800});
  };

  const toggleSymptom = (s: Symptom) => {
    setSelectedSymptoms(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s],
    );
  };

  return (
    <View style={[styles.container, {backgroundColor: C.bg}]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Icon name="notebook-edit" size={36} color="#fff" style={{marginBottom: 6}} />
        <Text style={styles.headerTitle}>기록</Text>
        {avg !== null && tab === 'period' && (
          <View style={styles.avgBadge}>
            <Icon name="chart-line" size={13} color={PINK} style={{marginRight: 4}} />
            <Text style={styles.avgText}>평균 주기 {avg}일</Text>
          </View>
        )}
      </View>

      {/* 탭 */}
      <View style={[styles.tabBar, {backgroundColor: C.card, borderBottomColor: C.border}]}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'period' && styles.tabBtnActive]}
          onPress={() => setTab('period')}>
          <Icon name="water" size={15} color={tab === 'period' ? PINK : C.hint} style={{marginRight: 5}} />
          <Text style={[styles.tabText, {color: tab === 'period' ? PINK : C.hint}]}>생리 기록</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'symptoms' && styles.tabBtnActive]}
          onPress={() => setTab('symptoms')}>
          <Icon name="emoticon-outline" size={15} color={tab === 'symptoms' ? PINK : C.hint} style={{marginRight: 5}} />
          <Text style={[styles.tabText, {color: tab === 'symptoms' ? PINK : C.hint}]}>증상·감정</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'stats' && styles.tabBtnActive]}
          onPress={() => setTab('stats')}>
          <Icon name="chart-bar" size={15} color={tab === 'stats' ? PINK : C.hint} style={{marginRight: 5}} />
          <Text style={[styles.tabText, {color: tab === 'stats' ? PINK : C.hint}]}>통계</Text>
        </TouchableOpacity>
      </View>

      {/* ── 생리 기록 탭 ── */}
      {tab === 'period' && (
        <>
          <ScrollView contentContainerStyle={styles.list}>
            {sortedPeriod.length === 0 ? (
              <View style={styles.empty}>
                <Icon name="calendar-plus" size={56} color={PINK_LIGHT} />
                <Text style={[styles.emptyTitle, {color: C.hint}]}>기록이 없어요</Text>
                <Text style={[styles.emptySub, {color: C.hint}]}>아래 + 버튼으로 생리 시작일을 추가해보세요</Text>
              </View>
            ) : (
              sortedPeriod.map((record, index) => {
                const prev = sortedPeriod[index + 1];
                const gap = prev ? daysBetween(record.startDate, prev.startDate) : null;
                const ago = daysAgo(record.startDate);
                return (
                  <View key={record.id} style={styles.recordCard}>
                    <View style={styles.recordLeft}>
                      <View style={styles.dot} />
                      {index < sortedPeriod.length - 1 && (
                        <View style={[styles.line, {backgroundColor: isDark ? '#3a1525' : '#FFF1F3'}]} />
                      )}
                    </View>
                    <View style={[styles.recordBody, {backgroundColor: C.card}]}>
                      <View style={styles.recordRow}>
                        <Text style={[styles.recordDate, {color: C.text}]}>{formatDateShort(record.startDate)}</Text>
                        {ago === 0 ? (
                          <View style={styles.todayBadge}><Text style={styles.todayBadgeText}>오늘</Text></View>
                        ) : (
                          <Text style={[styles.recordAgo, {color: C.hint}]}>{ago}일 전</Text>
                        )}
                      </View>
                      <Text style={[styles.recordFull, {color: C.hint}]}>{formatDate(record.startDate)}</Text>
                      {gap !== null && (
                        <View style={styles.gapRow}>
                          <Icon name="arrow-up" size={11} color={C.hint} />
                          <Text style={[styles.gapText, {color: C.hint}]}>이전 주기까지 {gap}일</Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity onPress={() => confirmPeriodDelete(record)} style={styles.deleteBtn}>
                      <Icon name="trash-can-outline" size={18} color={C.hint} />
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
            <View style={{height: 100}} />
          </ScrollView>

          <TouchableOpacity
            style={styles.fab}
            onPress={() => { setTempDate(new Date()); setSelectedDate(new Date()); setShowPeriodPicker(true); }}>
            <Icon name="plus" size={28} color="#fff" />
          </TouchableOpacity>

          {showPeriodPicker && Platform.OS === 'android' && (
            <DateTimePicker value={selectedDate} mode="date" display="default" onChange={onPeriodDateChange} maximumDate={new Date()} />
          )}
          <Modal visible={showPeriodPicker && Platform.OS === 'ios'} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, {backgroundColor: C.card}]}>
                <View style={[styles.modalHeader, {borderBottomColor: C.border}]}>
                  <TouchableOpacity onPress={() => setShowPeriodPicker(false)}>
                    <Text style={[styles.modalCancel, {color: C.hint}]}>취소</Text>
                  </TouchableOpacity>
                  <Text style={[styles.modalTitle, {color: C.text}]}>생리 시작일</Text>
                  <TouchableOpacity onPress={confirmPeriodAdd}>
                    <Text style={styles.modalConfirm}>추가</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker value={tempDate} mode="date" display="spinner" onChange={onPeriodDateChange} maximumDate={new Date()} locale="ko-KR" />
              </View>
            </View>
          </Modal>
        </>
      )}

      {/* ── 통계 탭 ── */}
      {tab === 'stats' && <StatisticsTab />}

      {/* ── 증상·감정 탭 ── */}
      {tab === 'symptoms' && (
        <>
          <ScrollView contentContainerStyle={styles.list}>
            {dayRecords.length === 0 ? (
              <View style={styles.empty}>
                <Icon name="clipboard-text-outline" size={64} color="#D1A7B8" />
                <Text style={[styles.emptyTitle, {color: C.hint}]}>기록이 없어요</Text>
                <Text style={[styles.emptySub, {color: C.hint}]}>아래 + 버튼으로 오늘의 증상을 기록해보세요</Text>
              </View>
            ) : (
              dayRecords.map(record => {
                const ago = daysAgo(record.date);
                const mood = MOODS.find(m => m.key === record.mood);
                return (
                  <View key={record.id} style={[styles.dayCard, {backgroundColor: C.card}]}>
                    <View style={styles.dayCardHeader}>
                      <View>
                        <Text style={[styles.recordDate, {color: C.text}]}>{formatDateShort(record.date)}</Text>
                        <Text style={[styles.recordFull, {color: C.hint}]}>
                          {ago === 0 ? '오늘' : ago === 1 ? '어제' : `${ago}일 전`}
                        </Text>
                      </View>
                      <View style={styles.dayCardRight}>
                        {mood && (
                          <View style={[styles.moodBadge, {backgroundColor: mood.color + '22'}]}>
                            <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                            <Text style={[styles.moodLabel, {color: mood.color}]}>{mood.label}</Text>
                          </View>
                        )}
                        <TouchableOpacity onPress={() => { deleteDayRecord(record.id); Toast.show({type: 'error', text1: '기록이 삭제됐어요', visibilityTime: 1800}); }} style={styles.deleteBtn}>
                          <Icon name="trash-can-outline" size={18} color={C.hint} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    {record.symptoms.length > 0 && (
                      <View style={styles.symptomChips}>
                        {record.symptoms.map(s => {
                          const info = SYMPTOMS.find(x => x.key === s)!;
                          return (
                            <View key={s} style={[styles.chip, {backgroundColor: info.color + '1A', borderColor: info.color + '44'}]}>
                              <Icon name={info.icon} size={12} color={info.color} style={{marginRight: 4}} />
                              <Text style={[styles.chipText, {color: info.color}]}>{info.label}</Text>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })
            )}
            <View style={{height: 100}} />
          </ScrollView>

          <TouchableOpacity style={styles.fab} onPress={openDayModal}>
            <Icon name="plus" size={28} color="#fff" />
          </TouchableOpacity>

          {/* 증상/감정 입력 모달 */}
          <Modal visible={showDayModal} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={[styles.dayModalContent, {backgroundColor: C.card}]}>
                <View style={[styles.modalHeader, {borderBottomColor: C.border}]}>
                  <TouchableOpacity onPress={() => setShowDayModal(false)}>
                    <Text style={[styles.modalCancel, {color: C.hint}]}>취소</Text>
                  </TouchableOpacity>
                  <Text style={[styles.modalTitle, {color: C.text}]}>증상·감정 기록</Text>
                  <TouchableOpacity onPress={saveDayRecord}>
                    <Text style={styles.modalConfirm}>저장</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.dayModalBody}>
                  {/* 날짜 선택 */}
                  <Text style={[styles.sectionLabel, {color: C.subtext}]}>날짜</Text>
                  <TouchableOpacity
                    style={[styles.datePill, {backgroundColor: isDark ? '#3a1020' : '#FFF1F3'}]}
                    onPress={() => setShowDayPicker(true)}>
                    <Icon name="calendar-month" size={16} color={PINK} style={{marginRight: 8}} />
                    <Text style={[styles.datePillText, {color: PINK}]}>{formatDate(dayDate)}</Text>
                  </TouchableOpacity>

                  {showDayPicker && (
                    <DateTimePicker
                      value={dayDate}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={onDayDateChange}
                      maximumDate={new Date()}
                    />
                  )}

                  {/* 증상 */}
                  <Text style={[styles.sectionLabel, {color: C.subtext}]}>증상</Text>
                  <View style={styles.symptomGrid}>
                    {SYMPTOMS.map(s => {
                      const active = selectedSymptoms.includes(s.key);
                      return (
                        <TouchableOpacity
                          key={s.key}
                          style={[
                            styles.symptomBtn,
                            {backgroundColor: active ? s.color : (isDark ? '#2a2a42' : '#f5f5f5'),
                             borderColor: active ? s.color : 'transparent'},
                          ]}
                          onPress={() => toggleSymptom(s.key)}>
                          <Icon name={s.icon} size={22} color={active ? '#fff' : C.subtext} />
                          <Text style={[styles.symptomBtnText, {color: active ? '#fff' : C.subtext}]}>{s.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* 감정 */}
                  <Text style={[styles.sectionLabel, {color: C.subtext}]}>감정</Text>
                  <View style={styles.moodRow}>
                    {MOODS.map(m => {
                      const active = selectedMood === m.key;
                      return (
                        <TouchableOpacity
                          key={m.key}
                          style={[
                            styles.moodBtn,
                            {backgroundColor: active ? m.color + '22' : (isDark ? '#2a2a42' : '#f5f5f5'),
                             borderColor: active ? m.color : 'transparent',
                             borderWidth: active ? 2 : 1},
                          ]}
                          onPress={() => setSelectedMood(prev => prev === m.key ? null : m.key)}>
                          <Text style={styles.moodBtnEmoji}>{m.emoji}</Text>
                          <Text style={[styles.moodBtnLabel, {color: active ? m.color : C.subtext}]}>{m.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    backgroundColor: PINK,
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: 'center',
  },
  headerTitle: {fontSize: 22, fontWeight: '700', color: '#fff'},
  avgBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 10,
  },
  avgText: {fontSize: 13, fontWeight: '700', color: PINK},
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {borderBottomColor: PINK},
  tabText: {fontSize: 14, fontWeight: '600'},
  list: {paddingTop: 16, paddingHorizontal: 16},
  empty: {alignItems: 'center', paddingTop: 80, gap: 12},
  emptyTitle: {fontSize: 18, fontWeight: '700'},
  emptySub: {fontSize: 13, textAlign: 'center'},
  recordCard: {flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4},
  recordLeft: {alignItems: 'center', width: 24, paddingTop: 4},
  dot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: PINK, borderWidth: 2, borderColor: PINK_LIGHT,
  },
  line: {width: 2, flex: 1, marginVertical: 2, minHeight: 40},
  recordBody: {
    flex: 1, borderRadius: 14, padding: 14,
    marginLeft: 10, marginBottom: 8,
    shadowColor: '#000', shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  recordRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  recordDate: {fontSize: 18, fontWeight: '700'},
  recordAgo: {fontSize: 12},
  recordFull: {fontSize: 12, marginTop: 2},
  todayBadge: {backgroundColor: PINK, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2},
  todayBadgeText: {fontSize: 11, color: '#fff', fontWeight: '700'},
  gapRow: {flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 3},
  gapText: {fontSize: 11},
  deleteBtn: {padding: 12, marginLeft: 4},
  fab: {
    position: 'absolute', right: 20, bottom: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: PINK, alignItems: 'center', justifyContent: 'center',
    shadowColor: PINK, shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  dayCard: {
    borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  dayCardHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'},
  dayCardRight: {flexDirection: 'row', alignItems: 'center', gap: 4},
  moodBadge: {flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, gap: 4},
  moodEmoji: {fontSize: 16},
  moodLabel: {fontSize: 12, fontWeight: '600'},
  symptomChips: {flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10},
  chip: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1,
  },
  chipText: {fontSize: 12, fontWeight: '600'},
  modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end'},
  modalContent: {borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 30},
  dayModalContent: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1,
  },
  modalTitle: {fontSize: 16, fontWeight: '600'},
  modalCancel: {fontSize: 16},
  modalConfirm: {fontSize: 16, color: PINK, fontWeight: '700'},
  dayModalBody: {padding: 20, paddingBottom: 40},
  sectionLabel: {fontSize: 13, fontWeight: '700', marginBottom: 12, marginTop: 8},
  datePill: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 20,
  },
  datePillText: {fontSize: 15, fontWeight: '600'},
  symptomGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20},
  symptomBtn: {
    width: '29%', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 14, borderWidth: 2, gap: 6,
  },
  symptomBtnText: {fontSize: 12, fontWeight: '600'},
  moodRow: {flexDirection: 'row', gap: 8, marginBottom: 10},
  moodBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 14, gap: 4,
  },
  moodBtnEmoji: {fontSize: 24},
  moodBtnLabel: {fontSize: 11, fontWeight: '600'},
});
