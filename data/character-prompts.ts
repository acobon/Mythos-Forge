import { CharacterPromptCategory } from '../types';

export const defaultCharacterPrompts: CharacterPromptCategory[] = [
    {
        key: 'backstory',
        label: 'Backstory & Origins',
        prompts: [
            { key: 'earliestMemory', label: 'What is their earliest memory?' },
            { key: 'familyRelationship', label: 'Describe their family and their relationship with them.' },
            { key: 'childhood', label: 'Where did they grow up, and what was it like?' },
            { key: 'education', label: 'What was their education or training?' },
            { key: 'definingMoment', label: 'What is a defining moment from their childhood?' },
            { key: 'childhoodFriends', label: 'Who were their childhood friends, and are they still in touch?' },
            { key: 'significantLoss', label: 'What is the most significant loss they have experienced?' },
        ]
    },
    {
        key: 'personality',
        label: 'Personality & Beliefs',
        prompts: [
            { key: 'greatestFear', label: 'What is their greatest fear?' },
            { key: 'values', label: 'What do they value most in life?' },
            { key: 'moralCode', label: 'What is their moral code? What lines will they not cross?' },
            { key: 'emotionalExpression', label: 'How do they act when they are angry? Sad? Happy?' },
            { key: 'biggestSecret', label: 'What is their biggest secret?' },
            { key: 'outlook', label: 'Are they an optimist, pessimist, or realist?' },
            { key: 'philosophy', label: 'What is their life\'s philosophy?' },
        ]
    },
    {
        key: 'goals',
        label: 'Goals & Motivations',
        prompts: [
            { key: 'ultimate', label: 'What is their ultimate goal in life (their \'why\')?' },
            { key: 'storyWant', label: 'What are they actively trying to achieve in the story (their \'want\')?' },
            { key: 'trueNeed', label: 'What do they truly need, which might be different from what they want?' },
            { key: 'obstacle', label: 'Who or what is standing in the way of their goal?' },
            { key: 'sacrifice', label: 'What are they willing to sacrifice to achieve their goal?' },
            { key: 'consequenceOfFailure', label: 'What would happen if they failed?' },
        ]
    },
    {
        key: 'relationships',
        label: 'Relationships & Interactions',
        prompts: [
            { key: 'mostImportantPerson', label: 'Who is the most important person in their life?' },
            { key: 'despisedPerson', label: 'Who do they secretly despise?' },
            { key: 'treatmentOfOthers', label: 'How do they treat strangers? Superiors? Subordinates?' },
            { key: 'leaderOrFollower', label: 'Are they a leader or a follower?' },
            { key: 'reputation', label: 'What is their reputation? Is it accurate?' },
            { key: 'advisor', label: 'Who do they turn to for advice?' },
        ]
    },
    {
        key: 'quirks',
        label: 'Quirks & Details',
        prompts: [
            { key: 'nervousHabit', label: 'What is a nervous habit they have?' },
            { key: 'favorites', label: 'What is their favorite food, color, or season?' },
            { key: 'style', label: 'How do they dress? What is their personal style?' },
            { key: 'prizedPossession', label: 'What is a prized possession of theirs?' },
            { key: 'freeTime', label: 'What do they do in their free time?' },
            { key: 'selfChange', label: 'If they could change one thing about themselves, what would it be?' },
        ]
    },
];
