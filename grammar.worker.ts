// grammar.worker.ts
import { grammarRules } from './components/common/editor/grammarRules';

const findGrammarIssues = (text: string, dictionary: string[]) => {
    const issues: { from: number, to: number, attrs: any }[] = [];
    const dictionarySet = new Set(dictionary.map(w => w.toLowerCase()));
    
    grammarRules.forEach(rule => {
        let match;
        rule.regex.lastIndex = 0; // Reset regex state for global flags
        while ((match = rule.regex.exec(text)) !== null) {
            const matchedWord = match[1] || match[0];
            if (dictionarySet.has(matchedWord.toLowerCase())) {
                continue;
            }
            
            const from = match.index;
            const to = from + match[0].length;
            
            issues.push({
                from,
                to,
                attrs: {
                    class: 'grammar-issue',
                    'data-message': rule.message,
                    'data-suggestion': rule.suggestion || '',
                    'data-match': match[0],
                    'data-word': matchedWord,
                }
            });
        }
    });

    return issues;
};

self.onmessage = (event: MessageEvent<{ text: string, dictionary: string[] }>) => {
    const { text, dictionary } = event.data;
    const issues = findGrammarIssues(text, dictionary);
    self.postMessage(issues);
};
