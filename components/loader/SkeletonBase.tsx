import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@/context/ThemeContext";

interface SkeletonBaseProps {
  children: React.ReactNode;
  style?: any;
}

export const SkeletonBase: React.FC<SkeletonBaseProps> = ({
  children,
  style,
}) => {
  const { colors } = useTheme();
  
  return <View style={[styles.container, { backgroundColor: colors.background }, style]}>{children}</View>;
};

export const SkeletonLine: React.FC<{
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}> = ({ width = "100%", height = 16, borderRadius = 8, style }) => {
  const { colors } = useTheme();
  
  return <View style={[styles.line, { width, height, borderRadius, backgroundColor: colors.border }, style]} />;
};

export const SkeletonCircle: React.FC<{
  size?: number;
  style?: any;
}> = ({ size = 50, style }) => {
  const { colors } = useTheme();
  
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.border },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  line: {
    // backgroundColor handled inline
  },
  circle: {
    // backgroundColor handled inline
  },
});