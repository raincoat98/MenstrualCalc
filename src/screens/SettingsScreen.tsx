import React, {useState} from 'react';
import {View, Text, TouchableOpacity, ScrollView, StyleSheet, Switch, Alert} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useCycleStore} from '../store/cycleStore';
import {PINK, PINK_PALE} from '../theme';
import Toast from 'react-native-toast-message';
import {scheduleNotifications, cancelAllNotifications, requestPermission} from '../notifications/notificationService';
import {useAppTheme} from '../hooks/useAppTheme';

function SectionHeader({title, color}: {title: string; color: string}) {
  return <Text style={[styles.sectionHeader, {color}]}>{title}</Text>;
}

function SettingRow({icon, label, labelColor, children}: {icon: string; label: string; labelColor: string; children: React.ReactNode}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Icon name={icon} size={20} color={PINK} style={{marginRight: 12}} />
        <Text style={[styles.rowLabel, {color: labelColor}]}>{label}</Text>
      </View>
      {children}
    </View>
  );
}

function Stepper({value, min, max, onChange, textColor}: {value: number; min: number; max: number; onChange: (v: number) => void; textColor: string}) {
  return (
    <View style={styles.stepper}>
      <TouchableOpacity style={styles.stepBtn} onPress={() => onChange(Math.max(min, value - 1))}>
        <Text style={styles.stepBtnText}>−</Text>
      </TouchableOpacity>
      <Text style={[styles.stepValue, {color: textColor}]}>{value}일</Text>
      <TouchableOpacity style={styles.stepBtn} onPress={() => onChange(Math.min(max, value + 1))}>
        <Text style={styles.stepBtnText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function SettingsScreen(): React.JSX.Element {
  const {C, isDark} = useAppTheme();
  const {
    cycleLength, setCycleLength, periodLength, setPeriodLength,
    lastPeriod, hasData,
    notiPeriod, setNotiPeriod,
    notiPeriodDays, setNotiPeriodDays,
    notiFertile, setNotiFertile,
    notiOvulation, setNotiOvulation,
    isDarkMode, toggleDarkMode,
  } = useCycleStore();

  const [saved, setSaved] = useState(false);

  const save = async () => {
    const anyEnabled = notiPeriod || notiFertile || notiOvulation;
    if (anyEnabled) {
      if (!hasData) {
        Alert.alert('알림 설정', '먼저 계산기에서 생리 시작일을 입력해주세요.');
        return;
      }
      await requestPermission();
      await scheduleNotifications(lastPeriod, cycleLength, {
        notiPeriod, notiPeriodDays, notiFertile, notiOvulation,
      });
    } else {
      await cancelAllNotifications();
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    Toast.show({type: 'success', text1: '저장됐어요', text2: '설정이 적용됐어요', visibilityTime: 2000});
  };

  return (
    <ScrollView style={[styles.container, {backgroundColor: C.bg}]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Icon name="cog" size={36} color="#fff" style={{marginBottom: 6}} />
        <Text style={styles.headerTitle}>설정</Text>
      </View>

      {/* 기본 주기 */}
      <SectionHeader title="기본 주기" color={PINK} />
      <View style={[styles.card, {backgroundColor: C.card}]}>
        <SettingRow icon="calendar-sync" label="생리 주기" labelColor={C.text}>
          <Stepper value={cycleLength} min={21} max={45} onChange={setCycleLength} textColor={C.text} />
        </SettingRow>
        <View style={[styles.divider, {backgroundColor: C.divider}]} />
        <SettingRow icon="water" label="생리 기간" labelColor={C.text}>
          <Stepper value={periodLength} min={2} max={10} onChange={setPeriodLength} textColor={C.text} />
        </SettingRow>
        <Text style={[styles.hint, {color: C.hint}]}>계산기와 달력에 공통으로 적용돼요</Text>
      </View>

      {/* 화면 */}
      <SectionHeader title="화면" color={PINK} />
      <View style={[styles.card, {backgroundColor: C.card}]}>
        <SettingRow icon={isDark ? 'weather-night' : 'white-balance-sunny'} label="다크 모드" labelColor={C.text}>
          <Switch
            value={isDarkMode}
            onValueChange={toggleDarkMode}
            trackColor={{false: C.switchTrackOff, true: '#F48FB1'}}
            thumbColor={isDarkMode ? PINK : '#f4f3f4'}
          />
        </SettingRow>
      </View>

      {/* 알림 */}
      <SectionHeader title="알림" color={PINK} />
      <View style={[styles.card, {backgroundColor: C.card}]}>
        <SettingRow icon="bell-ring" label="생리 예정 알림" labelColor={C.text}>
          <Switch
            value={notiPeriod}
            onValueChange={setNotiPeriod}
            trackColor={{false: C.switchTrackOff, true: '#F48FB1'}}
            thumbColor={notiPeriod ? PINK : '#f4f3f4'}
          />
        </SettingRow>
        {notiPeriod && (
          <View style={[styles.subRow, {backgroundColor: isDark ? '#2a1520' : PINK_PALE}]}>
            <Text style={[styles.subLabel, {color: C.subtext}]}>몇 일 전에 알릴까요?</Text>
            <View style={styles.stepper}>
              <TouchableOpacity style={styles.stepBtn} onPress={() => setNotiPeriodDays(Math.max(1, notiPeriodDays - 1))}>
                <Text style={styles.stepBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={[styles.stepValue, {color: C.text}]}>{notiPeriodDays}일 전</Text>
              <TouchableOpacity style={styles.stepBtn} onPress={() => setNotiPeriodDays(Math.min(7, notiPeriodDays + 1))}>
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        <View style={[styles.divider, {backgroundColor: C.divider}]} />
        <SettingRow icon="sprout" label="가임기 시작 알림" labelColor={C.text}>
          <Switch
            value={notiFertile}
            onValueChange={setNotiFertile}
            trackColor={{false: C.switchTrackOff, true: '#A5D6A7'}}
            thumbColor={notiFertile ? '#2E7D32' : '#f4f3f4'}
          />
        </SettingRow>
        <View style={[styles.divider, {backgroundColor: C.divider}]} />
        <SettingRow icon="egg" label="배란일 알림" labelColor={C.text}>
          <Switch
            value={notiOvulation}
            onValueChange={setNotiOvulation}
            trackColor={{false: C.switchTrackOff, true: '#CE93D8'}}
            thumbColor={notiOvulation ? '#7B1FA2' : '#f4f3f4'}
          />
        </SettingRow>
        <Text style={[styles.hint, {color: C.hint}]}>저장하기를 눌러야 알림이 적용돼요</Text>
      </View>

      {/* 앱 정보 */}
      <SectionHeader title="앱 정보" color={PINK} />
      <View style={[styles.card, {backgroundColor: C.card}]}>
        <SettingRow icon="information-outline" label="버전" labelColor={C.text}>
          <Text style={[styles.infoText, {color: C.subtext}]}>1.0.0</Text>
        </SettingRow>
        <View style={[styles.divider, {backgroundColor: C.divider}]} />
        <SettingRow icon="heart-outline" label="만든 이유" labelColor={C.text}>
          <Text style={[styles.infoText, {color: C.subtext}]}>건강한 주기 관리 💗</Text>
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
  container: {flex: 1},
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
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
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
  rowLabel: {fontSize: 15, fontWeight: '500'},
  divider: {height: 1},
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingLeft: 32,
    borderRadius: 10,
    marginBottom: 8,
    paddingRight: 8,
  },
  subLabel: {fontSize: 13},
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
  stepValue: {fontSize: 14, fontWeight: '700', minWidth: 44, textAlign: 'center'},
  hint: {fontSize: 12, paddingBottom: 12, paddingLeft: 4},
  infoText: {fontSize: 14},
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
