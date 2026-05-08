import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  SafeAreaView,
  StatusBar,
  Modal,
  Alert,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {PINK, PINK_LIGHT, PINK_PALE} from '../theme';
import {useCycleStore} from '../store/cycleStore';

interface CycleResult {
  nextPeriod: Date;
  ovulation: Date;
  fertileStart: Date;
  fertileEnd: Date;
  safeStart: Date;
  safeEnd: Date;
  daysUntilNext: number;
}

function formatDate(date: Date): string {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function formatDateShort(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function calcCycle(lastPeriod: Date, cycleLength: number, periodLength: number): CycleResult {
  const nextPeriod = addDays(lastPeriod, cycleLength);
  const ovulation = addDays(nextPeriod, -14);
  const fertileStart = addDays(ovulation, -5);
  const fertileEnd = addDays(ovulation, 1);
  const safeStart = addDays(lastPeriod, periodLength);
  const safeEnd = addDays(fertileStart, -1);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((nextPeriod.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return {nextPeriod, ovulation, fertileStart, fertileEnd, safeStart, safeEnd, daysUntilNext: diff};
}

export default function CalculatorScreen(): React.JSX.Element {
  const {apply, addRecord, cycleLength, setCycleLength, periodLength, setPeriodLength, lastPeriod: storedLastPeriod, hasData, reset} = useCycleStore();
  const [lastPeriod, setLastPeriod] = useState<Date>(hasData ? storedLastPeriod : new Date());
  const [result, setResult] = useState<CycleResult | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(hasData ? storedLastPeriod : new Date());
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  useEffect(() => {
    setLastPeriod(storedLastPeriod);
    setTempDate(storedLastPeriod);
  }, [storedLastPeriod]);

  const toggleCard = (card: string) => {
    setExpandedCard(prev => (prev === card ? null : card));
  };

  const onDateChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (selected) {
      if (Platform.OS === 'android') {
        setLastPeriod(selected);
      } else {
        setTempDate(selected);
      }
    }
  };

  const confirmIOSDate = () => {
    setLastPeriod(tempDate);
    setShowPicker(false);
  };

  const calculate = () => {
    const r = calcCycle(lastPeriod, cycleLength, periodLength);
    setResult(r);
    apply(lastPeriod, cycleLength, periodLength);
    addRecord(lastPeriod);
  };

  const handleReset = () => {
    Alert.alert('초기화', '모든 데이터를 초기화할까요?', [
      {text: '취소', style: 'cancel'},
      {
        text: '초기화',
        style: 'destructive',
        onPress: () => {
          reset();
          const today = new Date();
          setLastPeriod(today);
          setTempDate(today);
          setResult(null);
          setExpandedCard(null);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={PINK} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <Icon name="refresh" size={18} color="rgba(255,255,255,0.8)" />
            <Text style={styles.resetBtnText}>초기화</Text>
          </TouchableOpacity>
          <Icon name="flower-tulip" size={44} color="#fff" style={{marginBottom: 8}} />
          <Text style={styles.headerTitle}>월경 주기 계산기</Text>
          <Text style={styles.headerSub}>날짜를 입력하고 다음 주기를 확인하세요</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>마지막 생리 시작일</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => {
              setTempDate(lastPeriod);
              setShowPicker(true);
            }}>
            <Icon name="calendar-month" size={22} color={PINK} style={{marginRight: 10}} />
            <Text style={styles.dateButtonText}>{formatDate(lastPeriod)}</Text>
          </TouchableOpacity>

          {showPicker && Platform.OS === 'android' && (
            <DateTimePicker
              value={lastPeriod}
              mode="date"
              display="default"
              onChange={onDateChange}
              maximumDate={new Date()}
            />
          )}

          <Modal visible={showPicker && Platform.OS === 'ios'} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={() => setShowPicker(false)}>
                    <Text style={styles.modalCancel}>취소</Text>
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>날짜 선택</Text>
                  <TouchableOpacity onPress={confirmIOSDate}>
                    <Text style={styles.modalConfirm}>확인</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  onChange={onDateChange}
                  maximumDate={new Date()}
                  locale="ko-KR"
                />
              </View>
            </View>
          </Modal>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>생리 주기 (일)</Text>
          <View style={styles.stepper}>
            <TouchableOpacity style={styles.stepBtn} onPress={() => setCycleLength(Math.max(21, cycleLength - 1))}>
              <Text style={styles.stepBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.stepValue}>{cycleLength}일</Text>
            <TouchableOpacity style={styles.stepBtn} onPress={() => setCycleLength(Math.min(45, cycleLength + 1))}>
              <Text style={styles.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>일반적인 주기: 21~35일</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>생리 기간 (일)</Text>
          <View style={styles.stepper}>
            <TouchableOpacity style={styles.stepBtn} onPress={() => setPeriodLength(Math.max(2, periodLength - 1))}>
              <Text style={styles.stepBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.stepValue}>{periodLength}일</Text>
            <TouchableOpacity style={styles.stepBtn} onPress={() => setPeriodLength(Math.min(10, periodLength + 1))}>
              <Text style={styles.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>일반적인 기간: 3~7일</Text>
        </View>

        {result && (
          <View style={styles.resultContainer}>
            <View style={styles.resultTitleRow}>
              <Icon name="chart-bar" size={20} color="#333" style={{marginRight: 6}} />
              <Text style={styles.resultTitle}>계산 결과</Text>
            </View>

            <TouchableOpacity style={[styles.resultCard, styles.nextPeriodCard]} onPress={() => toggleCard('nextPeriod')} activeOpacity={0.8}>
              <View style={styles.resultCardRow}>
                <View style={styles.resultCardLabelRow}>
                  <Icon name="water" size={15} color="#C2185B" style={{marginRight: 5}} />
                  <Text style={[styles.resultCardLabel, {color: '#C2185B'}]}>다음 생리 예정일</Text>
                </View>
                <Icon name={expandedCard === 'nextPeriod' ? 'chevron-up' : 'chevron-down'} size={18} color="#aaa" />
              </View>
              <Text style={[styles.resultCardDate, {color: '#880E4F'}]}>{formatDate(result.nextPeriod)}</Text>
              <Text style={styles.resultCardSub}>
                {result.daysUntilNext > 0
                  ? `${result.daysUntilNext}일 후`
                  : result.daysUntilNext === 0
                  ? '오늘'
                  : `${Math.abs(result.daysUntilNext)}일 전 (지남)`}
              </Text>
              {expandedCard === 'nextPeriod' && (
                <>
                  <Text style={styles.resultCardDesc}>생리 전 PMS 시기입니다. 호르몬 변화로 붓기·피로·예민함이 나타날 수 있어요.</Text>
                  <View style={styles.foodSection}>
                    <View style={styles.foodTitleRow}>
                      <Icon name="food-apple" size={14} color="#C2185B" style={{marginRight: 4}} />
                      <Text style={[styles.foodTitle, {color: '#C2185B'}]}>추천 음식</Text>
                    </View>
                    <Text style={styles.foodItem}>• 마그네슘 (생리통 완화) — 바나나, 아몬드, 다크초콜릿</Text>
                    <Text style={styles.foodItem}>• 오메가3 (염증 완화) — 연어, 고등어, 아마씨</Text>
                    <Text style={styles.foodItem}>• 비타민 B6 — 닭고기, 감자, 아보카도</Text>
                    <Text style={[styles.foodItem, {color: '#e57373'}]}>• 자제 — 카페인, 짠 음식, 알코올</Text>
                  </View>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={[styles.resultCard, styles.ovulationCard]} onPress={() => toggleCard('ovulation')} activeOpacity={0.8}>
              <View style={styles.resultCardRow}>
                <View style={styles.resultCardLabelRow}>
                  <Icon name="egg" size={15} color="#7B1FA2" style={{marginRight: 5}} />
                  <Text style={[styles.resultCardLabel, {color: '#7B1FA2'}]}>배란 예정일</Text>
                </View>
                <Icon name={expandedCard === 'ovulation' ? 'chevron-up' : 'chevron-down'} size={18} color="#aaa" />
              </View>
              <Text style={[styles.resultCardDate, {color: '#4A148C'}]}>{formatDate(result.ovulation)}</Text>
              {expandedCard === 'ovulation' && (
                <>
                  <Text style={styles.resultCardDesc}>난자가 방출되는 날로, 임신 가능성이 가장 높은 시기입니다.</Text>
                  <View style={styles.foodSection}>
                    <View style={styles.foodTitleRow}>
                      <Icon name="food-apple" size={14} color="#7B1FA2" style={{marginRight: 4}} />
                      <Text style={[styles.foodTitle, {color: '#7B1FA2'}]}>추천 음식</Text>
                    </View>
                    <Text style={styles.foodItem}>• 엽산 — 시금치, 아스파라거스, 브로콜리</Text>
                    <Text style={styles.foodItem}>• 아연 — 굴, 호박씨, 쇠고기</Text>
                    <Text style={styles.foodItem}>• 비타민 C — 파프리카, 키위, 딸기</Text>
                  </View>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={[styles.resultCard, styles.fertileCard]} onPress={() => toggleCard('fertile')} activeOpacity={0.8}>
              <View style={styles.resultCardRow}>
                <View style={styles.resultCardLabelRow}>
                  <Icon name="sprout" size={15} color="#2E7D32" style={{marginRight: 5}} />
                  <Text style={[styles.resultCardLabel, {color: '#2E7D32'}]}>가임기</Text>
                </View>
                <Icon name={expandedCard === 'fertile' ? 'chevron-up' : 'chevron-down'} size={18} color="#aaa" />
              </View>
              <Text style={[styles.resultCardDate, {color: '#1B5E20'}]}>
                {formatDateShort(result.fertileStart)} ~ {formatDateShort(result.fertileEnd)}
              </Text>
              <Text style={styles.resultCardSub}>
                {formatDate(result.fertileStart)} ~ {formatDate(result.fertileEnd)}
              </Text>
              {expandedCard === 'fertile' && (
                <>
                  <Text style={styles.resultCardDesc}>임신 가능성이 있는 기간입니다. 정자는 체내에서 최대 5일간 생존할 수 있습니다.</Text>
                  <View style={styles.foodSection}>
                    <View style={styles.foodTitleRow}>
                      <Icon name="food-apple" size={14} color="#2E7D32" style={{marginRight: 4}} />
                      <Text style={[styles.foodTitle, {color: '#2E7D32'}]}>추천 음식</Text>
                    </View>
                    <Text style={styles.foodItem}>• 철분 — 시금치, 렌틸콩, 두부</Text>
                    <Text style={styles.foodItem}>• 비타민 E — 아몬드, 해바라기씨, 아보카도</Text>
                    <Text style={styles.foodItem}>• 항산화 — 블루베리, 석류, 브로콜리</Text>
                  </View>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={[styles.resultCard, styles.safeCard]} onPress={() => toggleCard('safe')} activeOpacity={0.8}>
              <View style={styles.resultCardRow}>
                <View style={styles.resultCardLabelRow}>
                  <Icon name="shield-check" size={15} color="#1565C0" style={{marginRight: 5}} />
                  <Text style={[styles.resultCardLabel, {color: '#1565C0'}]}>안전기 (생리 후)</Text>
                </View>
                <Icon name={expandedCard === 'safe' ? 'chevron-up' : 'chevron-down'} size={18} color="#aaa" />
              </View>
              <Text style={[styles.resultCardDate, {color: '#0D47A1'}]}>
                {formatDateShort(result.safeStart)} ~ {formatDateShort(result.safeEnd)}
              </Text>
              <Text style={styles.resultCardSub}>
                {formatDate(result.safeStart)} ~ {formatDate(result.safeEnd)}
              </Text>
              {expandedCard === 'safe' && (
                <>
                  <Text style={styles.resultCardDesc}>생리 직후로 임신 가능성이 낮은 시기입니다. 단, 주기가 불규칙하면 안전을 보장할 수 없습니다.</Text>
                  <View style={styles.foodSection}>
                    <View style={styles.foodTitleRow}>
                      <Icon name="food-apple" size={14} color="#1565C0" style={{marginRight: 4}} />
                      <Text style={[styles.foodTitle, {color: '#1565C0'}]}>추천 음식</Text>
                    </View>
                    <Text style={styles.foodItem}>• 칼슘 — 우유, 치즈, 두부</Text>
                    <Text style={styles.foodItem}>• 프로바이오틱스 — 요거트, 김치, 된장</Text>
                    <Text style={styles.foodItem}>• 비타민 D — 연어, 달걀, 표고버섯</Text>
                  </View>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.notice}>
              <Icon name="alert-circle-outline" size={16} color="#F9A825" style={{marginTop: 1}} />
              <Text style={styles.noticeText}>
                이 계산기는 참고용이며, 실제 주기는 개인마다 다를 수 있습니다. 정확한 정보는 의료 전문가에게 문의하세요.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
      <View style={styles.calcButtonContainer}>
        <TouchableOpacity style={styles.calcButton} onPress={calculate}>
          <Text style={styles.calcButtonText}>계산하기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: PINK},
  scroll: {paddingBottom: 24, backgroundColor: '#FFF5F8'},
  calcButtonContainer: {
    backgroundColor: '#FFF5F8',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0e0e6',
  },
  header: {
    backgroundColor: PINK,
    paddingTop: 24,
    paddingBottom: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  resetBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  resetBtnText: {fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: '600'},
  headerTitle: {fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 6},
  headerSub: {fontSize: 14, color: PINK_LIGHT},
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  label: {fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 12},
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PINK_PALE,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dateButtonText: {fontSize: 16, color: PINK, fontWeight: '600'},
  stepper: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20},
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PINK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {color: '#fff', fontSize: 22, fontWeight: '700', lineHeight: 26},
  stepValue: {fontSize: 22, fontWeight: '700', color: '#333', minWidth: 60, textAlign: 'center'},
  hint: {fontSize: 12, color: '#999', marginTop: 10, textAlign: 'center'},
  calcButton: {
    backgroundColor: PINK,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: PINK,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  calcButtonText: {color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 1},
  resultContainer: {marginTop: 8},
  resultTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 4,
  },
  resultTitle: {fontSize: 18, fontWeight: '700', color: '#333'},
  resultCard: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  nextPeriodCard: {backgroundColor: '#FFF0F5', borderColor: '#F06292'},
  ovulationCard: {backgroundColor: '#F5EEFF', borderColor: '#AB47BC'},
  fertileCard: {backgroundColor: '#EDFBEE', borderColor: '#66BB6A'},
  safeCard: {backgroundColor: '#EFF5FF', borderColor: '#5C9CE5'},
  resultCardLabel: {fontSize: 13, color: '#666', marginBottom: 6, fontWeight: '500'},
  resultCardDate: {fontSize: 20, fontWeight: '700', color: '#222', marginBottom: 4},
  resultCardSub: {fontSize: 13, color: '#888'},
  resultCardDesc: {fontSize: 12, color: '#999', marginTop: 8, lineHeight: 17},
  resultCardRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  resultCardLabelRow: {flexDirection: 'row', alignItems: 'center'},
  foodSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.07)',
  },
  foodTitleRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 6},
  foodTitle: {fontSize: 12, fontWeight: '700'},
  foodItem: {fontSize: 12, color: '#666', lineHeight: 20},
  notice: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#FFF9C4',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#F9A825',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  noticeText: {fontSize: 12, color: '#5D4037', lineHeight: 18, flex: 1},
  modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end'},
  modalContent: {backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 30},
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {fontSize: 16, fontWeight: '600', color: '#333'},
  modalCancel: {fontSize: 16, color: '#999'},
  modalConfirm: {fontSize: 16, color: PINK, fontWeight: '600'},
});
