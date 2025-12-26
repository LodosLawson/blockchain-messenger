import 'react-native-get-random-values';
import { Buffer } from 'buffer';
import process from 'process';

global.Buffer = Buffer;
global.process = process;

// Additional safety for some libraries checking window
if (typeof window !== 'undefined') {
    (window as any).Buffer = Buffer;
    (window as any).process = process;
} else {
    (global as any).window = global;
}
