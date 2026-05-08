import React, {useState} from 'react';
import {View, Text, TouchableOpacity, ScrollView, StyleSheet, Switch} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useCycleStore} from '../store/cycleStore';
import {PINK, PINK_PALE} from '../theme';

function SectionHeader({title}: {title: string}) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function SettingRow({icon, label, children}: {icon: string; label: string; children: React.ReactNode}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Icon name={icon} size={20} color={PINK} style={{marginRight: 12}} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      {children}
    </View>
  );
}

function Stepper({value, min, max, onChange}: {value: number; min: number; max: number; onChange: (v: number) => void}) {
  return (
    <View style={styles.stepper}>
      <TouchableOpacity style={styles.stepBtn} onPress={() => onChange(Math.max(min, value - 1))}>
        <Text style={styles.stepBtnText}>−</Text>
      </TouchableOpacity>
      <Text style={styles.stepValue}>{value}일</Text>
      <TouchableOpacity style={styles.stepBtn} onPress={() => onChange(Math.min(max, value + 1))}>
        <Text style={styles.stepBtnText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function SettingsScreen(): React.JSX.Element {
  const {cycleLength, setCycleLength, periodLength, setPeriodLength} = useCycleStore();

  const [notiPeriod, setNotiPeriod] = useState(true);
  const [notiPeriodDays, setNotiPeriodDays] = useState(3);
  const [notiFertile, setNotiFertile] = useState(false);
  const [notiOvulation, setNotiOvulation] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Icon name="cog" size={36} color="#fff" style={{marginBottom: 6}} />
        <Text style={styles.headerTitle}>설정</Text>
      </View>

      {/* 기본 주기 */}
      <SectionHeader title="기본 주기" />
      <View style={styles.card}>
        <SettingRow icon="calendar-sync" label="생리 주기">
          <Stepper value={cycleLength} min={21} max={45} onChange={setCycleLength} />
        </SettingRow>
        <View style={styles.divider} />
        <SettingRow icon="water" label="생리 기간">
          <Stepper value={periodLength} min={2} max={10} onChange={setPeriodLength} />
        </SettingRow>
        <Text style={styles.hint}>계산기와 달력에 공통으로 적용돼요</Text>
      </View>

      {/* 알림 */}
      <SectionHeader title="알림" />
      <View style={styles.card}>
        <SettingRow icon="bell-ring" label="생리 예정 알림">
          <Switch
            value={notiPeriod}
            onValueChange={setNotiPeriod}
            trackColor={{false: '#ddd', true: '#F48FB1'}}
            thumbColor={notiPeriod ? PINK : '#f4f3f4'}
          />
        </SettingRow>
        {notiPeriod && (
          <View style={styles.subRow}>
            <Text style={styles.subLabel}>몇 일 전에 알릴까요?</Text>
            <View style={styles.stepper}>
              <TouchableOpacity style={styles.stepBtn} onPress={() => setNotiPeriodDays(v => Math.max(1, v - 1))}>
                <Text style={styles.stepBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepValue}>{notiPeriodDays}일 전</Text>
              <TouchableOpacity style={styles.stepBtn} onPress={() => setNotiPeriodDays(v => Math.min(7, v + 1))}>
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        <View style={styles.divider} />
        <SettingRow icon="sprout" label="가임기 시작 알림">
          <Switch
            value={notiFertile}
            onValueChange={setNotiFertile}
            trackColor={{false: '#ddd', true: '#A5D6A7'}}
            thumbColor={notiFertile ? '#2E7D32' : '#f4f3f4'}
          />
        </SettingRow>
        <View style={styles.divider} />
        <SettingRow icon="egg" label="배란일 알림">
          <Switch
            value={notiOvulation}
            onValueChange={setNotiOvulation}
            trackColor={{false: '#ddd', true: '#CE93D8'}}
            thumbColor={notiOvulation ? '#7B1FA2' : '#f4f3f4'}
          />
        </SettingRow>
        <Text style={styles.hint}>알림 기능은 곧 지원 예정이에요</Text>
      </View>

      {/* 앱 정보 */}
      <SectionHeader title="앱 정보" />
      <View style={styles.card}>
        <SettingRow icon="information-outline" label="버전">
          <Text style={styles.infoText}>1.0.0</Text>
        </SettingRow>
        <View style={styles.divider} />
        <SettingRow icon="heart-outline" label="만든 이유">
          <Text style={styles.infoText}>건강한 주기 관리 💗</Text>
        </SettingRow>
      </View>

      {/* 저장 버튼 */}
      <TouchableOpacity style={[styles.saveBtn, saved && styles.saveBtnDone]} onPress={save}>
        <Icon name={saved ? 'check' : 'content-save'} size={18} color="#fff" style={{marginRight: 8}} />
        <Text style={styles.saveBtnText}>{saved ? '저장됨' : '저장하기'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FFF5F8'},
  content: {paddingBottom: 40},
  header: {
    backgroundColor: PINK,
    paddingTop: 20,
    paddingBottom: 28,
    alignItems: 'center',
  },
  headerTitle: {fontSize: 22, fontWeight: '700', color: '#fff'},
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: PINK,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  rowLeft: {flexDirection: 'row', alignItems: 'center'},
  rowLabel: {fontSize: 15, color: '#333', fontWeight: '500'},
  divider: {height: 1, backgroundColor: '#f5f5f5'},
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingLeft: 32,
    backgroundColor: PINK_PALE,
    borderRadius: 10,
    marginBottom: 8,
    paddingRight: 8,
  },
  subLabel: {fontSize: 13, color: '#888'},
  stepper: {flexDirection: 'row', alignItems: 'center', gap: 8},
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: PINK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {color: '#fff', fontSize: 18, fontWeight: '700', lineHeight: 20},
  stepValue: {fontSize: 14, fontWeight: '700', color: '#333', minWidth: 44, textAlign: 'center'},
  hint: {fontSize: 12, color: '#bbb', paddingBottom: 12, paddingLeft: 4},
  infoText: {fontSize: 14, color: '#999'},
  saveBtn: {
    backgroundColor: PINK,
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PINK,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  saveBtnDone: {backgroundColor: '#43A047'},
  saveBtnText: {color: '#fff', fontSize: 16, fontWeight: '700'},
});
