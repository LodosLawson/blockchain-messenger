import { ViewStyle, TextStyle } from 'react-native';
import { DefaultTheme } from '@react-navigation/native';

export const Colors = {
    DeepVoid: '#000000',
    TraceEmerald: '#10B981',
    MintGlitch: '#34D399',
    GlassWhite: 'rgba(255,255,255,0.05)',
    SubtleBorder: 'rgba(255,255,255,0.1)', // Slightly increased visibility for mobile
    MutedText: '#6B7280',
    DangerRed: '#EF4444',
    White: '#FFFFFF',
    LightGray: '#E5E7EB',
};

export const NetraTheme = {
    ...DefaultTheme,
    dark: true,
    colors: {
        ...DefaultTheme.colors,
        primary: Colors.TraceEmerald,
        background: Colors.DeepVoid,
        card: Colors.GlassWhite, // Or DeepVoid depending on nav
        text: Colors.White,
        border: Colors.SubtleBorder,
        notification: Colors.DangerRed,
    },
    fonts: {
        regular: {
            fontFamily: 'sans-serif',
            fontWeight: 'normal' as 'normal',
        },
        medium: {
            fontFamily: 'sans-serif-medium',
            fontWeight: 'normal' as 'normal',
        },
        bold: {
            fontFamily: 'sans-serif',
            fontWeight: 'bold' as 'bold',
        },
        heavy: {
            fontFamily: 'sans-serif',
            fontWeight: '900' as '900',
        },
    },
};

export const GlassStyle: ViewStyle = {
    backgroundColor: Colors.GlassWhite,
    borderColor: Colors.SubtleBorder,
    borderWidth: 1,
    borderRadius: 12,
    // Backdrop blur is platform specific, usually requires Expo BlurView. 
    // We simulate with opacity for broad compatibility.
};

export const Typography: { [key: string]: TextStyle } = {
    H1: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.White,
        letterSpacing: -0.5,
    },
    H2: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.White,
    },
    Body: {
        fontSize: 16,
        color: Colors.LightGray,
    },
    Data: {
        fontFamily: 'monospace', // Platform specific adjustment might be needed
        fontSize: 12,
        color: Colors.MutedText,
    },
    DataHighlight: {
        fontFamily: 'monospace',
        fontSize: 12,
        color: Colors.TraceEmerald,
    }
};
