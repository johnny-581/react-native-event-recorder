import { getDateKey, useEvent } from "@/context/EventContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import * as Haptics from "expo-haptics";
import { Check, Circle, Edit3 } from "lucide-react-native";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MOTIVATIONAL_MESSAGES = [
  "Consistency is what matters.",
  "Small steps lead to big changes.",
  "You're building something great.",
  "Every day counts.",
  "Keep showing up.",
  "Progress, not perfection.",
  "One day at a time.",
  "You've got this!",
];

function getRandomMessage() {
  return MOTIVATIONAL_MESSAGES[
    Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)
  ];
}

function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return date.toLocaleDateString("en-US", options);
}

export default function DayView() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { eventName, setEventName, selectedDate, toggleDay, isRecorded } =
    useEvent();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(eventName);
  const [motivationalMessage] = useState(getRandomMessage);

  const dateKey = getDateKey(selectedDate);
  const recorded = isRecorded(dateKey);

  const isToday = getDateKey(new Date()) === dateKey;

  const handleToggle = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleDay(dateKey);
  };

  const handleSaveEdit = () => {
    if (editedName.trim()) {
      setEventName(editedName.trim());
    } else {
      setEditedName(eventName);
    }
    setIsEditing(false);
  };

  const colors = {
    background: isDark ? "#0D1117" : "#F8FAFC",
    card: isDark ? "#161B22" : "#FFFFFF",
    text: isDark ? "#E6EDF3" : "#1E293B",
    textSecondary: isDark ? "#8B949E" : "#64748B",
    accent: "#10B981", // Emerald green
    accentLight: isDark ? "#065F46" : "#D1FAE5",
    border: isDark ? "#30363D" : "#E2E8F0",
    buttonInactive: isDark ? "#21262D" : "#F1F5F9",
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      {/* Date Header */}
      <View style={styles.header}>
        <Text style={[styles.dateText, { color: colors.text }]}>
          {formatDate(selectedDate)}
        </Text>
        {isToday && (
          <View style={[styles.todayBadge, { backgroundColor: colors.accent }]}>
            <Text style={styles.todayText}>Today</Text>
          </View>
        )}
      </View>

      {/* Event Name */}
      <Pressable
        style={styles.eventNameContainer}
        onPress={() => {
          setEditedName(eventName);
          setIsEditing(true);
        }}
      >
        <Text style={[styles.eventName, { color: colors.text }]}>
          {eventName}
        </Text>
        <Edit3 size={18} color={colors.textSecondary} style={styles.editIcon} />
      </Pressable>

      {/* Main Toggle Button */}
      <View style={styles.buttonContainer}>
        <Pressable
          onPress={handleToggle}
          style={({ pressed }) => [
            styles.toggleButton,
            {
              backgroundColor: recorded ? colors.accent : colors.buttonInactive,
              borderColor: recorded ? colors.accent : colors.border,
              transform: [{ scale: pressed ? 0.95 : 1 }],
            },
          ]}
        >
          {recorded ? (
            <Check size={80} color="#FFFFFF" strokeWidth={3} />
          ) : (
            <Circle size={80} color={colors.textSecondary} strokeWidth={2} />
          )}
        </Pressable>
        <Text
          style={[
            styles.statusText,
            { color: recorded ? colors.accent : colors.textSecondary },
          ]}
        >
          {recorded ? "Recorded!" : "Tap to record"}
        </Text>
      </View>

      {/* Motivational Message */}
      <View
        style={[
          styles.messageCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.messageText, { color: colors.textSecondary }]}>
          "{motivationalMessage}"
        </Text>
      </View>

      {/* Edit Modal */}
      <Modal
        visible={isEditing}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsEditing(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Rename Your Event
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={editedName}
              onChangeText={setEditedName}
              placeholder="e.g., Swimming, Meditation..."
              placeholderTextColor={colors.textSecondary}
              autoFocus
              selectTextOnFocus
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={[
                  styles.modalButton,
                  { backgroundColor: colors.buttonInactive },
                ]}
                onPress={() => setIsEditing(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, { backgroundColor: colors.accent }]}
                onPress={handleSaveEdit}
              >
                <Text style={[styles.modalButtonText, { color: "#FFFFFF" }]}>
                  Save
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 8,
    gap: 12,
  },
  dateText: {
    fontSize: 18,
    fontWeight: "500",
  },
  todayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  todayText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  eventNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  eventName: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  editIcon: {
    marginLeft: 10,
  },
  buttonContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  toggleButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  statusText: {
    marginTop: 24,
    fontSize: 18,
    fontWeight: "600",
  },
  messageCard: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 40,
  },
  messageText: {
    fontSize: 16,
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
