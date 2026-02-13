const getEntropyScore = function (buffer: Buffer): number {
    if (buffer.length === 0) return 0;

    const freq = new Map<number, number>();
    for (const byte of buffer) {
        freq.set(byte, (freq.get(byte) || 0) + 1);
    }

    let res: number = 0;
    for (const count of freq.values()) {
        const p: number = count / buffer.length;
        res -= p * Math.log2(p);
    }
    return res;
}

export { getEntropyScore };