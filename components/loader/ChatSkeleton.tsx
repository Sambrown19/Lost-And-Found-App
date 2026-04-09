import React from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { SkeletonBase, SkeletonLine, SkeletonCircle } from "./SkeletonBase";
import { useTheme } from "@/context/ThemeContext";

const MessageSkeleton = ({
  isMyMessage = false,
}: {
  isMyMessage?: boolean;
}) => {
  const { colors } = useTheme();
  
  return (
    <View
      style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessage : styles.theirMessage,
      ]}
    >
      {!isMyMessage && <SkeletonCircle size={32} />}
      <View
        style={[
          styles.messageBubble,
          isMyMessage 
            ? [styles.myBubble, { backgroundColor: colors.border }]
            : [styles.theirBubble, { backgroundColor: colors.border }],
        ]}
      >
        {!isMyMessage && (
          <SkeletonLine width={80} height={12} style={styles.mb1} />
        )}
        <SkeletonLine width={180} height={16} style={styles.mb1} />
        <SkeletonLine width={120} height={14} />
        <View style={styles.messageFooter}>
          <SkeletonLine width={40} height={10} />
        </View>
      </View>
    </View>
  );
};

export default function ChatSkeleton() {
  const { colors } = useTheme();
  
  return (
    <SkeletonBase style={styles.container}>
      <View style={[
        styles.header, 
        { 
          backgroundColor: colors.white,
          borderBottomColor: colors.border 
        }
      ]}>
        <View style={[styles.backButtonSkeleton, { backgroundColor: colors.border }]} />
        <View style={styles.headerInfo}>
          <SkeletonCircle size={40} />
          <View>
            <SkeletonLine width={120} height={16} style={styles.mb1} />
            <SkeletonLine width={60} height={12} />
          </View>
        </View>
      </View>

      <FlatList
        data={[1, 2, 3, 4, 5, 6]}
        renderItem={({ index }) => (
          <MessageSkeleton isMyMessage={index % 2 === 0} />
        )}
        keyExtractor={(item) => item.toString()}
        contentContainerStyle={styles.messagesList}
      />

      <View style={[
        styles.safetyReminder, 
        { backgroundColor: "rgba(255, 152, 0, 0.1)" }
      ]}>
        <View style={[styles.safetyIcon, { backgroundColor: colors.border }]} />
        <SkeletonLine width="85%" height={12} />
      </View>

      <View style={[
        styles.inputContainer, 
        { 
          backgroundColor: colors.white,
          borderTopColor: colors.border 
        }
      ]}>
        <View style={[styles.attachButtonSkeleton, { backgroundColor: colors.border }]} />
        <SkeletonLine width="70%" height={40} borderRadius={20} />
        <View style={[styles.sendButtonSkeleton, { backgroundColor: colors.border }]} />
      </View>
    </SkeletonBase>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    gap: 10,
  },
  backButtonSkeleton: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  messagesList: {
    padding: 15,
    flexGrow: 1,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 15,
    gap: 8,
  },
  myMessage: {
    justifyContent: "flex-end",
  },
  theirMessage: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "75%",
    borderRadius: 16,
    padding: 10,
  },
  myBubble: {
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    borderBottomLeftRadius: 4,
  },
  messageFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  safetyReminder: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 8,
  },
  safetyIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  attachButtonSkeleton: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  sendButtonSkeleton: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  mb1: {
    marginBottom: 4,
  },
});