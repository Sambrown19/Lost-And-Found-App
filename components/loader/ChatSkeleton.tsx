import React from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { SkeletonBase, SkeletonLine, SkeletonCircle } from "./SkeletonBase";
import Colors from "../../constants/Colors";

const MessageSkeleton = ({
  isMyMessage = false,
}: {
  isMyMessage?: boolean;
}) => (
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
        isMyMessage ? styles.myBubble : styles.theirBubble,
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

export default function ChatSkeleton() {
  return (
    <SkeletonBase style={styles.container}>
      <View style={styles.header}>
        <View style={styles.backButtonSkeleton} />
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

      <View style={styles.safetyReminder}>
        <View style={styles.safetyIcon} />
        <SkeletonLine width="85%" height={12} />
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.attachButtonSkeleton} />
        <SkeletonLine width="70%" height={40} borderRadius={20} />
        <View style={styles.sendButtonSkeleton} />
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
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  backButtonSkeleton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e1e9ee",
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
    backgroundColor: "#e1e9ee",
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: "#e8e8e8",
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
    backgroundColor: "rgba(255, 152, 0, 0.1)",
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 8,
  },
  safetyIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#e1e9ee",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 10,
  },
  attachButtonSkeleton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#e1e9ee",
  },
  sendButtonSkeleton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e1e9ee",
  },
  mb1: {
    marginBottom: 4,
  },
});
