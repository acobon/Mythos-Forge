export interface GrammarRule {
    message: string;
    suggestion?: string;
    regex: RegExp;
    replace?: (match: RegExpExecArray) => string;
}

export const grammarRules: GrammarRule[] = [
    {
        message: 'Repeated word.',
        suggestion: 'Remove the repeated word.',
        regex: /\b(\w+)\s+\1\b/gi,
        replace: (match) => match[1],
    },
    {
        message: 'Use of "basically" can weaken your point.',
        suggestion: 'Consider removing it.',
        regex: /\b(basically)\b/gi,
        replace: () => '',
    },
    {
        message: 'Use of "actually" is often redundant.',
        suggestion: 'Consider removing it.',
        regex: /\b(actually)\b/gi,
        replace: () => '',
    },
    {
        message: 'Passive voice detected.',
        suggestion: 'Consider using active voice.',
        regex: /\b(is|are|was|were|be|been|being)\s+([a-zA-Z]+ed)\b/g,
    },
    {
        message: '"Utilize" is a common buzzword.',
        suggestion: 'Consider using "use" instead.',
        regex: /\b(utilize|utilizes|utilized)\b/gi,
        replace: () => 'use',
    }
];