import { describe, it, expect } from 'vitest';
import { getEntropyScore } from '../../src/Helpers/Entropy.js';

describe('getEntropyScore', () => {
    it('should return 0 for empty buffer', () => {
        const buffer = Buffer.alloc(0);
        expect(getEntropyScore(buffer)).toBe(0);
    });

    it('should return 0 for buffer with single byte', () => {
        const buffer = Buffer.from([42]);
        expect(getEntropyScore(buffer)).toBe(0);
    });

    it('should return 0 for buffer with all identical bytes', () => {
        const buffer = Buffer.from([65, 65, 65, 65, 65]);
        expect(getEntropyScore(buffer)).toBe(0);
    });

    it('should calculate entropy for two different bytes with equal frequency', () => {
        const buffer = Buffer.from([0, 1, 0, 1]);
        // Each byte appears 2 times out of 4, p = 0.5
        // entropy = -2*(0.5 * log2(0.5)) = -2*(0.5 * -1) = -2*(-0.5) = 1
        expect(getEntropyScore(buffer)).toBe(1);
    });

    it('should calculate entropy for uniform distribution of 4 bytes', () => {
        const buffer = Buffer.from([0, 1, 2, 3]);
        // Each byte appears 1 time out of 4, p = 0.25
        // entropy = -4*(0.25 * log2(0.25)) = -4*(0.25 * -2) = -4*(-0.5) = 2
        expect(getEntropyScore(buffer)).toBe(2);
    });

    it('should calculate entropy for uniform distribution of 256 bytes', () => {
        const buffer = Buffer.from(Array.from({ length: 256 }, (_, i) => i));
        // Each byte appears 1 time out of 256, p = 1/256
        // entropy = -256*(1/256 * log2(1/256)) = -256*(1/256 * -8) = -256*(-1/32) = 8
        expect(getEntropyScore(buffer)).toBe(8);
    });

    it('should calculate entropy for non-uniform distribution', () => {
        const buffer = Buffer.from([1, 1, 1, 2, 2, 3]);
        // Byte 1: 3/6 = 0.5, contribution: -(0.5 * log2(0.5)) = -(-0.5) = 0.5
        // Byte 2: 2/6 ≈ 0.333, contribution: -(0.333 * log2(0.333)) ≈ -(0.333 * -1.585) ≈ 0.528
        // Byte 3: 1/6 ≈ 0.167, contribution: -(0.167 * log2(0.167)) ≈ -(0.167 * -2.585) ≈ 0.431
        // Total entropy ≈ 0.5 + 0.528 + 0.431 = 1.459
        const result = getEntropyScore(buffer);
        expect(result).toBeCloseTo(1.459, 3);
    });

    it('should handle large buffers', () => {
        const buffer = Buffer.alloc(1000, 0);
        buffer[500] = 1; // One different byte
        const result = getEntropyScore(buffer);
        expect(result).toBeGreaterThan(0);
        expect(result).toBeLessThan(1); // Should be low entropy
    });

    it('should handle buffer with maximum byte values', () => {
        const buffer = Buffer.from([0, 127, 255]);
        const result = getEntropyScore(buffer);
        expect(result).toBeGreaterThan(1);
        expect(result).toBeLessThan(2);
    });

    it('should be deterministic (same input produces same output)', () => {
        const buffer1 = Buffer.from([1, 2, 3, 4, 5]);
        const buffer2 = Buffer.from([1, 2, 3, 4, 5]);
        expect(getEntropyScore(buffer1)).toBe(getEntropyScore(buffer2));
    });

    it('should handle buffer with repeated patterns', () => {
        const buffer = Buffer.from([1, 2, 1, 2, 1, 2]);
        // Two unique bytes, each appearing 3 times out of 6
        // p = 0.5 for each, entropy = -2*(0.5 * log2(0.5)) = 1
        expect(getEntropyScore(buffer)).toBe(1);
    });

    it('should return higher entropy for more random-looking data', () => {
        const lowEntropy = Buffer.from([0, 0, 0, 0, 1, 1, 1, 1]);
        const highEntropy = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7]);

        const lowScore = getEntropyScore(lowEntropy);
        const highScore = getEntropyScore(highEntropy);

        expect(highScore).toBeGreaterThan(lowScore);
    });

    it('should handle very small buffers correctly', () => {
        const buffer2 = Buffer.from([0, 1]);
        // 2 unique bytes, each with p=0.5, entropy = 1
        expect(getEntropyScore(buffer2)).toBe(1);

        const buffer3 = Buffer.from([0, 1, 2]);
        // 3 unique bytes, each with p≈0.333, entropy > 1
        expect(getEntropyScore(buffer3)).toBeGreaterThan(1);
    });
});
