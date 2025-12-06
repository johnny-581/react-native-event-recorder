import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEvent, getDateKey } from '@/context/EventContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function getCurrentStreak(recordedDays: Set<string>): number {
  let streak = 0;
  const today = new Date();
  const current = new Date(today);
  
  while (true) {
    const key = getDateKey(current);
    if (recordedDays.has(key)) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

interface MonthViewProps {
  year: number;
  month: number;
  colors: Record<string, string>;
  isRecorded: (key: string) => boolean;
  onDayPress: (date: Date) => void;
}

function MonthCalendar({ year, month, colors, isRecorded, onDayPress }: MonthViewProps) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();
  const todayKey = getDateKey(today);
  
  const days: (number | null)[] = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  
  // Add days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }
  
  // Fill remaining cells to complete the grid
  while (days.length % 7 !== 0) {
    days.push(null);
  }

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <View style={styles.calendar}>
      {/* Days of week header */}
      <View style={styles.weekHeader}>
        {DAYS_OF_WEEK.map((day) => (
          <View key={day} style={styles.weekDayCell}>
            <Text style={[styles.weekDayText, { color: colors.textSecondary }]}>
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.weekRow}>
          {week.map((day, dayIndex) => {
            if (day === null) {
              return <View key={dayIndex} style={styles.dayCell} />;
            }
            
            const date = new Date(year, month, day);
            const dateKey = getDateKey(date);
            const recorded = isRecorded(dateKey);
            const isToday = dateKey === todayKey;
            const isFuture = date > today;

            return (
              <Pressable
                key={dayIndex}
                style={[
                  styles.dayCell,
                  recorded && { backgroundColor: colors.accent },
                  isToday && !recorded && { borderWidth: 2, borderColor: colors.accent },
                ]}
                onPress={() => {
                  if (!isFuture) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onDayPress(date);
                  }
                }}
                disabled={isFuture}
              >
                <Text
                  style={[
                    styles.dayText,
                    { color: recorded ? '#FFFFFF' : isFuture ? colors.textMuted : colors.text },
                    isToday && !recorded && { fontWeight: '700' },
                  ]}
                >
                  {day}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export default function MonthView() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const { eventName, isRecorded, setSelectedDate, recordedDays } = useEvent();
  
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  
  const scrollViewRef = useRef<ScrollView>(null);

  const colors = {
    background: isDark ? '#0D1117' : '#F8FAFC',
    card: isDark ? '#161B22' : '#FFFFFF',
    text: isDark ? '#E6EDF3' : '#1E293B',
    textSecondary: isDark ? '#8B949E' : '#64748B',
    textMuted: isDark ? '#484F58' : '#CBD5E1',
    accent: '#10B981',
    accentLight: isDark ? '#065F46' : '#D1FAE5',
    border: isDark ? '#30363D' : '#E2E8F0',
    streakBg: isDark ? '#F97316' : '#FDBA74',
  };

  const streak = getCurrentStreak(recordedDays);

  const goToPreviousMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDayPress = (date: Date) => {
    setSelectedDate(date);
    router.push('/');
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const threshold = 50;
    
    if (offsetY < -threshold) {
      goToPreviousMonth();
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    } else if (offsetY > threshold) {
      goToNextMonth();
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }
  };

  // Calculate stats for this month
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const recordedThisMonth = Array.from(recordedDays).filter(key => {
    const [y, m] = key.split('-').map(Number);
    return y === currentYear && m === currentMonth + 1;
  }).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.eventTitle, { color: colors.text }]}>{eventName}</Text>
        
        {/* Streak Badge */}
        {streak > 0 && (
          <View style={[styles.streakBadge, { backgroundColor: colors.streakBg }]}>
            <Flame size={16} color="#FFFFFF" />
            <Text style={styles.streakText}>{streak} day streak!</Text>
          </View>
        )}
      </View>

      {/* Month Navigation */}
      <View style={styles.monthNav}>
        <Pressable onPress={goToPreviousMonth} style={styles.navButton}>
          <ChevronLeft size={28} color={colors.text} />
        </Pressable>
        <View style={styles.monthTitleContainer}>
          <Text style={[styles.monthTitle, { color: colors.text }]}>
            {MONTHS[currentMonth]} {currentYear}
          </Text>
          <Text style={[styles.monthStats, { color: colors.textSecondary }]}>
            {recordedThisMonth} / {daysInMonth} days
          </Text>
        </View>
        <Pressable onPress={goToNextMonth} style={styles.navButton}>
          <ChevronRight size={28} color={colors.text} />
        </Pressable>
      </View>

      {/* Swipeable Calendar */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScrollEndDrag={handleScroll}
        bounces={true}
      >
        <View style={[styles.calendarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MonthCalendar
            year={currentYear}
            month={currentMonth}
            colors={colors}
            isRecorded={isRecorded}
            onDayPress={handleDayPress}
          />
        </View>

        {/* Swipe hint */}
        <Text style={[styles.swipeHint, { color: colors.textMuted }]}>
          Swipe up/down to change months
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  eventTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
    gap: 6,
  },
  streakText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  navButton: {
    padding: 8,
  },
  monthTitleContainer: {
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 22,
    fontWeight: '600',
  },
  monthStats: {
    fontSize: 14,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  calendarCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  calendar: {
    gap: 8,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 13,
    fontWeight: '600',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginHorizontal: 2,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
  },
  swipeHint: {
    textAlign: 'center',
    fontSize: 13,
    marginTop: 20,
  },
});
