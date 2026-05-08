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
import {useCycleStore, PeriodRecord} from '../store/cycleStore';
import {PINK, PINK_PALE, PINK_LIGHT} from '../theme';

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

export default function RecordsScreen(): React.JSX.Element {
  const {records, addRecord, deleteRecord} = useCycleStore();
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tempDate, setTempDate] = useState(new Date());

  const avg = avgCycle(records);
  const sorted = [...records].sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

  const onDateChange = (_: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (date) {
        const exists = records.some(r => formatDate(r.startDate) === formatDate(date));
        if (exists) {
          Alert.alert('중복', '이미 같은 날짜의 기록이 있어요.');
          return;
        }
        addRecord(date);
      }
    } else {
      if (date) setTempDate(date);
    }
  };

  const confirmAdd = () => {
    const dateToAdd = Platform.OS === 'ios' ? tempDate : selectedDate;
    const exists = records.some(
      r => formatDate(r.startDate) === formatDate(dateToAdd),
    );
    if (exists) {
      Alert.alert('중복', '이미 같은 날짜의 기록이 있어요.');
      return;
    }
    addRecord(dateToAdd);
    setShowPicker(false);
  };

  const confirmDelete = (record: PeriodRecord) => {
    Alert.alert(
      '기록 삭제',
      `${formatDate(record.startDate)} 기록을 삭제할까요?`,
      [
        {text: '취소', style: 'cancel'},
        {text: '삭제', style: 'destructive', onPress: () => deleteRecord(record.id)},
      ],
    );
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Icon name="notebook-edit" size={36} color="#fff" style={{marginBottom: 6}} />
        <Text style={styles.headerTitle}>생리 기록</Text>
        {avg !== null && (
          <View style={styles.avgBadge}>
            <Icon name="chart-line" size={13} color={PINK} style={{marginRight: 4}} />
            <Text style={styles.avgText}>평균 주기 {avg}일</Text>
          </View>
        )}
      </View>

      {/* 기록 목록 */}
      <ScrollView contentContainerStyle={styles.list}>
        {sorted.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="calendar-plus" size={56} color={PINK_LIGHT} />
            <Text style={styles.emptyTitle}>기록이 없어요</Text>
            <Text style={styles.emptySub}>아래 + 버튼으로 생리 시작일을 추가해보세요</Text>
          </View>
        ) : (
          sorted.map((record, index) => {
            const prev = sorted[index + 1];
            const gap = prev ? daysBetween(record.startDate, prev.startDate) : null;
            const ago = daysAgo(record.startDate);

            return (
              <View key={record.id} style={styles.recordCard}>
                <View style={styles.recordLeft}>
                  <View style={styles.dot} />
                  {index < sorted.length - 1 && <View style={styles.line} />}
                </View>
                <View style={styles.recordBody}>
                  <View style={styles.recordRow}>
                    <Text style={styles.recordDate}>{formatDateShort(record.startDate)}</Text>
                    {ago === 0 ? (
                      <View style={styles.todayBadge}><Text style={styles.todayBadgeText}>오늘</Text></View>
                    ) : (
                      <Text style={styles.recordAgo}>{ago}일 전</Text>
                    )}
                  </View>
                  <Text style={styles.recordFull}>{formatDate(record.startDate)}</Text>
                  {gap !== null && (
                    <View style={styles.gapRow}>
                      <Icon name="arrow-up" size={11} color="#aaa" />
                      <Text style={styles.gapText}>이전 주기까지 {gap}일</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity onPress={() => confirmDelete(record)} style={styles.deleteBtn}>
                  <Icon name="trash-can-outline" size={18} color="#ddd" />
                </TouchableOpacity>
              </View>
            );
          })
        )}
        <View style={{height: 100}} />
      </ScrollView>

      {/* 추가 버튼 */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setTempDate(new Date());
          setSelectedDate(new Date());
          setShowPicker(true);
        }}>
        <Icon name="plus" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Android picker */}
      {showPicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onDateChange}
          maximumDate={new Date()}
        />
      )}

      {/* iOS picker modal */}
      <Modal visible={showPicker && Platform.OS === 'ios'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={styles.modalCancel}>취소</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>생리 시작일</Text>
              <TouchableOpacity onPress={confirmAdd}>
                <Text style={styles.modalConfirm}>추가</Text>
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

      {/* Android 추가 확인 */}
      {Platform.OS === 'android' && !showPicker && selectedDate < new Date() && records.length >= 0 && false && (
        <View />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FFF5F8'},
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
  list: {paddingTop: 16, paddingHorizontal: 16},
  empty: {alignItems: 'center', paddingTop: 80, gap: 12},
  emptyTitle: {fontSize: 18, fontWeight: '700', color: '#ccc'},
  emptySub: {fontSize: 13, color: '#bbb', textAlign: 'center'},
  recordCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  recordLeft: {alignItems: 'center', width: 24, paddingTop: 4},
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: PINK,
    borderWidth: 2,
    borderColor: PINK_LIGHT,
  },
  line: {width: 2, flex: 1, backgroundColor: PINK_PALE, marginVertical: 2, minHeight: 40},
  recordBody: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginLeft: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  recordRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  recordDate: {fontSize: 18, fontWeight: '700', color: '#222'},
  recordAgo: {fontSize: 12, color: '#aaa'},
  recordFull: {fontSize: 12, color: '#bbb', marginTop: 2},
  todayBadge: {
    backgroundColor: PINK,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  todayBadgeText: {fontSize: 11, color: '#fff', fontWeight: '700'},
  gapRow: {flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 3},
  gapText: {fontSize: 11, color: '#bbb'},
  deleteBtn: {padding: 12, marginLeft: 4},
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: PINK,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PINK,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end'},
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
  },
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
  modalConfirm: {fontSize: 16, color: PINK, fontWeight: '700'},
});
