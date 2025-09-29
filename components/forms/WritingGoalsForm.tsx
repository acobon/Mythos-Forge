import React, { useState, useMemo } from 'react';
import { StoryBible, FormFieldType } from '../../types';
import { Input, Button } from '../common/ui';
import { useFormValidation } from '../../hooks/useFormValidation';

interface WritingGoalsFormProps {
    goals: StoryBible['writingGoals'];
    onSave: (goals: StoryBible['writingGoals']) => void;
    onClose: () => void;
}

const WritingGoalsForm: React.FC<WritingGoalsFormProps> = ({ goals, onSave, onClose }) => {
    const [projectGoal, setProjectGoal] = useState(goals?.projectWordGoal || 0);
    const [dailyGoal, setDailyGoal] = useState(goals?.dailyWordGoal || 0);

    const validationSchema = useMemo(() => ({
        projectGoal: {
            field: { fieldName: 'projectGoal', label: 'Project Goal', fieldType: 'number' as FormFieldType },
            custom: (value: number) => (value < 0 ? 'Goal cannot be negative.' : undefined),
        },
        dailyGoal: {
            field: { fieldName: 'dailyGoal', label: 'Daily Goal', fieldType: 'number' as FormFieldType },
            custom: (value: number) => (value < 0 ? 'Goal cannot be negative.' : undefined),
        }
    }), []);
    const { errors, validate, clearError } = useFormValidation(validationSchema);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const data = { projectGoal, dailyGoal };
        if (!validate(data)) return;
        
        onSave({
            projectWordGoal: Number(projectGoal) || 0,
            dailyWordGoal: Number(dailyGoal) || 0,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="project-goal" className="block text-sm font-medium text-text-secondary">Project Word Goal</label>
                <Input
                    id="project-goal"
                    type="number"
                    value={projectGoal}
                    onChange={(e) => { setProjectGoal(parseInt(e.target.value, 10) || 0); clearError('projectGoal'); }}
                    className="mt-1"
                    min="0"
                    error={!!errors.projectGoal}
                />
                {errors.projectGoal && <p className="text-red-500 text-xs mt-1">{errors.projectGoal}</p>}
            </div>
            <div>
                <label htmlFor="daily-goal" className="block text-sm font-medium text-text-secondary">Daily Word Goal</label>
                <Input
                    id="daily-goal"
                    type="number"
                    value={dailyGoal}
                    onChange={(e) => { setDailyGoal(parseInt(e.target.value, 10) || 0); clearError('dailyGoal'); }}
                    className="mt-1"
                    min="0"
                    error={!!errors.dailyGoal}
                />
                 {errors.dailyGoal && <p className="text-red-500 text-xs mt-1">{errors.dailyGoal}</p>}
            </div>
            <div className="flex justify-end pt-2 space-x-2">
                <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                <Button type="submit">Save Goals</Button>
            </div>
        </form>
    );
};

export default WritingGoalsForm;