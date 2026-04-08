import React from "react";
import { View, StyleSheet } from "react-native";
import Colors from "../../constants/Colors";

interface SkeletonBaseProps {
  children: React.ReactNode;
  style?: any;
}

export const SkeletonBase: React.FC<SkeletonBaseProps> = ({
  children,
  style,
}) => {
  return <View style={[styles.container, style]}>{children}</View>;
};

export const SkeletonLine: React.FC<{
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}> = ({ width = "100%", height = 16, borderRadius = 8, style }) => {
  return <View style={[styles.line, { width, height, borderRadius }, style]} />;
};

export const SkeletonCircle: React.FC<{
  size?: number;
  style?: any;
}> = ({ size = 50, style }) => {
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
  },
  line: {
    backgroundColor: "#e1e9ee",
  },
  circle: {
    backgroundColor: "#e1e9ee",
  },
});
