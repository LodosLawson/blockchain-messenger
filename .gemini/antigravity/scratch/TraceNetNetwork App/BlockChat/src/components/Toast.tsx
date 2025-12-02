import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';

interface ToastProps {
    message: string;
    visible: boolean;
    onHide: () => void;
    type?: 'success' | 'error' | 'info';
}

export const Toast: React.FC<ToastProps> = ({ message, visible, onHide, type = 'info' }) => {
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.delay(3000),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start(() => onHide());
        }
    }, [visible]);

    if (!visible) return null;

    const getBackgroundColor = () => {
        switch (type) {
            case 'success': return '#4CAF50';
            case 'error': return '#F44336';
            default: return '#2196F3';
        }
    };

    return (
        <Animated.View style={[styles.container, { opacity, backgroundColor: getBackgroundColor() }]}>
            <TouchableOpacity onPress={onHide}>
                <Text style={styles.text}>{message}</Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        padding: 15,
        borderRadius: 8,
        elevation: 5,
        zIndex: 9999,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    text: {
        color: 'white',
        fontSize: 16,
        textAlign: 'center',
        fontWeight: '500',
    },
});
