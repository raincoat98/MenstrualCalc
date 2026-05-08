import React, {useState, useEffect, useRef} from 'react';
import {View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform, Modal, PanResponder} from 'react-native';
import DateTimePicker, {DateTimePickerEvent} from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import {useCycleStore} from '../store/cycleStore';
import {PINK, PINK_PALE} from '../theme';
import {useAppTheme} from '../hooks/useAppTheme';

function formatDate(date: Date): string {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

type DayPhase = 'period' | 'ovulation' | 'fertile' | 'safe' | 'luteal';

const PHASE_STYLE: Record<DayPhase, {bg: string; text: string; label: string}> = {
  period:    {bg: '#FFD6DE', text: '#F43F5E', label: '생리'},
  ovulation: {bg: '#EDE9FE', text: '#7C3AED', label: '배란'},
  fertile:   {bg: '#D1FAE5', text: '#059669', label: '가임기'},
  safe:      {bg: '#DBEAFE', text: '#2563EB', label: '안전기'},
  luteal:    {bg: 'transparent', text: '', label: ''},
};

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

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

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstWeekday(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarScreen(): React.JSX.Element {
  const {C, isDark} = useAppTheme();
  const {lastPeriod: storedPeriod, cycleLength: storedCycle, periodLength: storedPeriodLen, hasData, apply, addRecord, setCycleLength, setPeriodLength} = useCycleStore();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [panelOpen, setPanelOpen] = useState(!hasData);
  const [localPeriod, setLocalPeriod] = useState(storedPeriod);
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(storedPeriod);
  const [showYearMonth, setShowYearMonth] = useState(false);
  const [pickerYear, setPickerYear] = useState(today.getFullYear());

  useEffect(() => {
    setLocalPeriod(storedPeriod);
    setTempDate(storedPeriod);
  }, [storedPeriod]);

  const onDateChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') { setShowPicker(false); }
    if (selected) {
      if (Platform.OS === 'android') { setLocalPeriod(selected); }
      else { setTempDate(selected); }
    }
  };

  const applySettings = () => {
    addRecord(localPeriod);
    apply(localPeriod, storedCycle, storedPeriodLen);
    setPanelOpen(false);
    Toast.show({type: 'success', text1: '달력에 적용됐어요', visibilityTime: 1800});
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else { setViewMonth(m => m - 1); }
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else { setViewMonth(m => m + 1); }
  };

  const swipeRef = useRef<(dir: 1 | -1) => void>(() => {});
  swipeRef.current = (dir: 1 | -1) => {
    if (dir === 1) {
      if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
      else { setViewMonth(viewMonth + 1); }
    } else {
      if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
      else { setViewMonth(viewMonth - 1); }
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 20 && Math.abs(gs.dx) > Math.abs(gs.dy) * 1.5,
      onPanResponderRelease: (_, gs) => {
        if (gs.dx < -40) { swipeRef.current(1); }
        else if (gs.dx > 40) { swipeRef.current(-1); }
      },
    }),
  ).current;

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstWeekday = getFirstWeekday(viewYear, viewMonth);

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({length: daysInMonth}, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const todayDate = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();
  const isToday = (day: number) =>
    day === todayDate && viewMonth === todayMonth && viewYear === todayYear;

  return (
    <View style={[styles.container, {backgroundColor: C.bg}]}>
      {/* 고정 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
          <Icon name="chevron-left" size={26} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerTitleBtn}
          onPress={() => { setPickerYear(viewYear); setShowYearMonth(true); }}>
          <Text style={styles.headerTitle}>{viewYear}년 {viewMonth + 1}월</Text>
          <Icon name="menu-down" size={20} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
        <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
          <Icon name="chevron-right" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* 년/월 선택 모달 */}
      <Modal visible={showYearMonth} transparent animationType="fade">
        <TouchableOpacity
          style={styles.ymOverlay}
          activeOpacity={1}
          onPress={() => setShowYearMonth(false)}>
          <View style={[styles.ymModal, {backgroundColor: C.card}]}>
            <View style={styles.ymYearRow}>
              <TouchableOpacity onPress={() => setPickerYear(y => y - 1)} style={styles.ymNavBtn}>
                <Icon name="chevron-left" size={22} color={PINK} />
              </TouchableOpacity>
              <Text style={[styles.ymYearText, {color: C.text}]}>{pickerYear}년</Text>
              <TouchableOpacity onPress={() => setPickerYear(y => y + 1)} style={styles.ymNavBtn}>
                <Icon name="chevron-right" size={22} color={PINK} />
              </TouchableOpacity>
            </View>
            <View style={styles.ymMonthGrid}>
              {Array.from({length: 12}, (_, i) => {
                const isSelected = pickerYear === viewYear && i === viewMonth;
                const isCurrentMonth = pickerYear === today.getFullYear() && i === today.getMonth();
                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.ymMonthCell,
                      {backgroundColor: isDark ? '#2a2a42' : '#f5f5f5'},
                      isSelected && styles.ymMonthSelected,
                    ]}
                    onPress={() => {
                      setViewYear(pickerYear);
                      setViewMonth(i);
                      setShowYearMonth(false);
                    }}>
                    <Text style={[
                      styles.ymMonthText,
                      {color: C.text},
                      isSelected && styles.ymMonthTextSelected,
                      isCurrentMonth && !isSelected && styles.ymMonthTextToday,
                    ]}>
                      {i + 1}월
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView style={[styles.scroll, {backgroundColor: C.bg}]} contentContainerStyle={styles.content}>
        {/* 접이식 설정 패널 */}
        <TouchableOpacity
          style={[styles.panelToggle, {backgroundColor: C.card}]}
          onPress={() => setPanelOpen(o => !o)}
          activeOpacity={0.8}>
          <View style={styles.panelToggleRow}>
            <Icon name="tune" size={16} color={PINK} style={{marginRight: 6}} />
            <Text style={styles.panelToggleText}>주기 설정</Text>
          </View>
          <Icon name={panelOpen ? 'chevron-up' : 'chevron-down'} size={18} color={PINK} />
        </TouchableOpacity>

        {panelOpen && (
          <View style={[styles.panel, {backgroundColor: C.card}]}>
            <Text style={[styles.panelLabel, {color: C.subtext}]}>마지막 생리 시작일</Text>
            <TouchableOpacity
              style={[styles.dateButton, {backgroundColor: isDark ? '#3a1020' : PINK_PALE}]}
              onPress={() => { setTempDate(localPeriod); setShowPicker(true); }}>
              <Icon name="calendar-month" size={18} color={PINK} style={{marginRight: 8}} />
              <Text style={styles.dateButtonText}>{formatDate(localPeriod)}</Text>
            </TouchableOpacity>

            {showPicker && Platform.OS === 'android' && (
              <DateTimePicker value={localPeriod} mode="date" display="default" onChange={onDateChange} maximumDate={new Date()} />
            )}
            <Modal visible={showPicker && Platform.OS === 'ios'} transparent animationType="slide">
              <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, {backgroundColor: C.card}]}>
                  <View style={[styles.modalHeader, {borderBottomColor: C.border}]}>
                    <TouchableOpacity onPress={() => setShowPicker(false)}>
                      <Text style={[styles.modalCancel, {color: C.hint}]}>취소</Text>
                    </TouchableOpacity>
                    <Text style={[styles.modalTitle, {color: C.text}]}>날짜 선택</Text>
                    <TouchableOpacity onPress={() => { setLocalPeriod(tempDate); setShowPicker(false); }}>
                      <Text style={styles.modalConfirm}>확인</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker value={tempDate} mode="date" display="spinner" onChange={onDateChange} maximumDate={new Date()} locale="ko-KR" />
                </View>
              </View>
            </Modal>

            {/* 주기 / 기간 스테퍼 */}
            <View style={styles.stepperRow}>
              <View style={styles.stepperItem}>
                <Text style={[styles.panelLabel, {color: C.subtext}]}>주기</Text>
                <View style={styles.stepper}>
                  <TouchableOpacity style={styles.stepBtn} onPress={() => setCycleLength(Math.max(21, storedCycle - 1))}>
                    <Text style={styles.stepBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={[styles.stepValue, {color: C.text}]}>{storedCycle}일</Text>
                  <TouchableOpacity style={styles.stepBtn} onPress={() => setCycleLength(Math.min(45, storedCycle + 1))}>
                    <Text style={styles.stepBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.stepperItem}>
                <Text style={[styles.panelLabel, {color: C.subtext}]}>생리 기간</Text>
                <View style={styles.stepper}>
                  <TouchableOpacity style={styles.stepBtn} onPress={() => setPeriodLength(Math.max(2, storedPeriodLen - 1))}>
                    <Text style={styles.stepBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={[styles.stepValue, {color: C.text}]}>{storedPeriodLen}일</Text>
                  <TouchableOpacity style={styles.stepBtn} onPress={() => setPeriodLength(Math.min(10, storedPeriodLen + 1))}>
                    <Text style={styles.stepBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.applyBtn} onPress={applySettings}>
              <Text style={styles.applyBtnText}>달력에 적용</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.calendarCard, {backgroundColor: C.card}]} {...panResponder.panHandlers}>
          {/* 요일 헤더 */}
          <View style={styles.weekRow}>
            {WEEKDAYS.map((d, i) => (
              <Text
                key={d}
                style={[
                  styles.weekday,
                  {color: C.subtext},
                  i === 0 && {color: '#E53935'},
                  i === 6 && {color: '#1565C0'},
                ]}>
                {d}
              </Text>
            ))}
          </View>

          {/* 날짜 그리드 */}
          {Array.from({length: cells.length / 7}, (_, row) => (
            <View key={row} style={styles.weekRow}>
              {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
                if (!day) return <View key={col} style={styles.dayCell} />;

                const date = new Date(viewYear, viewMonth, day);
                const phase = hasData
                  ? getDayPhase(date, storedPeriod, storedCycle, storedPeriodLen)
                  : 'luteal';
                const ps = PHASE_STYLE[phase];
                const isSun = col === 0;
                const isSat = col === 6;
                const dayColor = phase === 'luteal'
                  ? (isSun ? '#E53935' : isSat ? '#1565C0' : C.text)
                  : ps.text;

                return (
                  <View key={col} style={styles.dayCell}>
                    <View style={[styles.dayBg, {backgroundColor: ps.bg}]}>
                      <Text
                        style={[
                          styles.dayText,
                          {color: dayColor},
                          isToday(day) && styles.todayText,
                        ]}>
                        {day}
                      </Text>
                      {isToday(day) && <View style={styles.todayDot} />}
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {/* 범례 */}
        <View style={styles.legend}>
          {(Object.entries(PHASE_STYLE) as [DayPhase, typeof PHASE_STYLE[DayPhase]][])
            .filter(([, v]) => v.label)
            .map(([phase, v]) => (
              <View key={phase} style={styles.legendItem}>
                <View style={[styles.legendDot, {backgroundColor: v.bg, borderColor: v.text}]} />
                <Text style={[styles.legendText, {color: C.subtext}]}>{v.label}</Text>
              </View>
            ))}
        </View>

        {!hasData && (
          <View style={[styles.emptyNotice, {backgroundColor: isDark ? '#2a1520' : '#FCE4EC'}]}>
            <Icon name="information-outline" size={18} color={PINK} style={{marginRight: 8}} />
            <Text style={styles.emptyText}>계산기 탭에서 먼저 계산해주세요</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  scroll: {flex: 1},
  content: {paddingBottom: 40},
  header: {
    backgroundColor: PINK,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  navBtn: {padding: 8},
  headerTitleBtn: {flexDirection: 'row', alignItems: 'center', gap: 2},
  headerTitle: {fontSize: 20, fontWeight: '700', color: '#fff'},
  ymOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center'},
  ymModal: {
    borderRadius: 20,
    padding: 20,
    width: 280,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  ymYearRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16},
  ymNavBtn: {padding: 8},
  ymYearText: {fontSize: 18, fontWeight: '700'},
  ymMonthGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  ymMonthCell: {
    width: '22%',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  ymMonthSelected: {backgroundColor: PINK},
  ymMonthText: {fontSize: 14, fontWeight: '600'},
  ymMonthTextSelected: {color: '#fff'},
  ymMonthTextToday: {color: PINK},
  calendarCard: {
    margin: 16,
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  weekRow: {flexDirection: 'row'},
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    paddingVertical: 8,
  },
  dayCell: {flex: 1, alignItems: 'center', paddingVertical: 3},
  dayBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {fontSize: 14, fontWeight: '500'},
  todayText: {fontWeight: '800'},
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: PINK,
    marginTop: 1,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 4,
  },
  legendItem: {flexDirection: 'row', alignItems: 'center', gap: 6},
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
  },
  legendText: {fontSize: 12},
  panelToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#F06292',
  },
  panelToggleRow: {flexDirection: 'row', alignItems: 'center'},
  panelToggleText: {fontSize: 14, fontWeight: '600', color: PINK},
  panel: {
    marginHorizontal: 16,
    marginTop: 4,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  panelLabel: {fontSize: 13, fontWeight: '600', marginBottom: 8},
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  dateButtonText: {fontSize: 14, color: PINK, fontWeight: '600'},
  stepperRow: {flexDirection: 'row', gap: 12, marginBottom: 14},
  stepperItem: {flex: 1},
  stepper: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10},
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: PINK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {color: '#fff', fontSize: 20, fontWeight: '700', lineHeight: 22},
  stepValue: {fontSize: 16, fontWeight: '700', minWidth: 44, textAlign: 'center'},
  applyBtn: {
    backgroundColor: PINK,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  applyBtnText: {color: '#fff', fontSize: 15, fontWeight: '700'},
  modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end'},
  modalContent: {borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 30},
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {fontSize: 16, fontWeight: '600'},
  modalCancel: {fontSize: 16},
  modalConfirm: {fontSize: 16, color: PINK, fontWeight: '600'},
  emptyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 14,
  },
  emptyText: {fontSize: 13, color: PINK, fontWeight: '500'},
});
