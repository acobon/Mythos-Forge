

import React, { useState, useEffect, useMemo, useRef } from 'react';
import FocusTrap from 'focus-trap-react';
import { OnboardingStatus, TranslationKey, ViewType } from '../types';
import { useI18n } from '../hooks/useI18n';
import { Z_INDEX } from '../constants';
import { useAppSelector, useAppDispatch } from '../state/hooks';
import { completeOnboarding } from '../state/uiSlice';
import { onboardingRefService } from '../services/onboardingRefService';
import { useNavigation } from '../hooks/useNavigation';

export type OnboardingStep = {
    targetKey: string;
    content: TranslationKey | string;
    awaits: 'next_click' | 'entity_created' | 'entity_selected' | 'work_created';
    position?: 'top' | 'bottom' | 'left' | 'right';
};

const OnboardingTutorial: React.FC = () => {
    const dispatch = useAppDispatch();
    const { selectedId } = useAppSelector(state => state.ui);
    const storyBibleState = useAppSelector(state => state.bible.present);
    const [stepIndex, setStepIndex] = useState(0);
    const entityCountOnStepStart = useRef(0);
    const workCountOnStepStart = useRef(0);
    const { t } = useI18n();
    const { navigateToView } = useNavigation();

    const steps: (OnboardingStep & { navigateTo?: ViewType })[] = useMemo(
        () => [
            {
                targetKey: 'body',
                content: 'onboarding.step1.content',
                awaits: 'next_click',
            },
            {
                targetKey: 'add-character',
                content: 'onboarding.step2.content',
                position: 'right',
                awaits: 'entity_created',
            },
            {
                targetKey: 'selected-entity-item',
                content: 'onboarding.step3.content',
                position: 'left',
                awaits: 'next_click',
            },
            {
                targetKey: 'add-event',
                content: 'onboarding.step4.content',
                position: 'bottom',
                awaits: 'next_click',
            },
            {
                targetKey: 'add-work-button',
                content: 'onboarding.step5.content',
                position: 'top',
                awaits: 'work_created',
                navigateTo: ViewType.WORKS_ORGANIZER,
            },
            {
                targetKey: 'planning-board-header',
                content: 'onboarding.step6.content',
                position: 'bottom',
                awaits: 'next_click',
                navigateTo: ViewType.PLOTTING,
            },
            {
                targetKey: 'body',
                content: 'onboarding.step7.content',
                awaits: 'next_click',
            },
        ],
        []
    );

    const currentStep = steps[stepIndex];

    const targetElement = useMemo(() => {
        if (!currentStep) return null;
        if (currentStep.targetKey === 'body') return document.body;
        return onboardingRefService.get(currentStep.targetKey) || null;
    }, [currentStep, stepIndex]); // Rerun when stepIndex changes to find new element

    useEffect(() => {
        if (currentStep?.awaits === 'entity_created') {
            entityCountOnStepStart.current = Object.keys(storyBibleState.entities.entities).length;
        }
        if (currentStep?.awaits === 'work_created') {
            workCountOnStepStart.current = Object.keys(storyBibleState.narrative.works).length;
        }
    }, [stepIndex, currentStep, storyBibleState.entities, storyBibleState.narrative.works]);

    useEffect(() => {
        if (!currentStep) return;

        if (
            currentStep.awaits === 'entity_created' &&
            Object.keys(storyBibleState.entities.entities).length > entityCountOnStepStart.current
        ) {
            // A small delay to let the UI update from the modal closing
            setTimeout(() => setStepIndex((s) => s + 1), 200);
        }
        if (currentStep.awaits === 'entity_selected' && selectedId) {
            setStepIndex((s) => s + 1);
        }
        if (
            currentStep.awaits === 'work_created' &&
            Object.keys(storyBibleState.narrative.works).length > workCountOnStepStart.current
        ) {
            setTimeout(() => setStepIndex((s) => s + 1), 200);
        }
    }, [storyBibleState.entities, storyBibleState.narrative.works, currentStep, selectedId]);

    useEffect(() => {
        if (!targetElement || currentStep.targetKey === 'body') {
            return;
        }

        const originalPosition = targetElement.style.position;
        const originalZIndex = targetElement.style.zIndex;

        if (window.getComputedStyle(targetElement).position === 'static') {
            targetElement.style.position = 'relative';
        }
        targetElement.style.zIndex = String(Z_INDEX.ONBOARDING + 1);

        return () => {
            targetElement.style.position = originalPosition;
            targetElement.style.zIndex = originalZIndex;
        };
    }, [targetElement, currentStep]);

    const handleNext = () => {
        const nextStepIndex = stepIndex + 1;
        if (nextStepIndex < steps.length) {
            const nextStep = steps[nextStepIndex];
            if (nextStep.navigateTo) {
                navigateToView(nextStep.navigateTo);
            }
            setStepIndex(nextStepIndex);
        } else {
            dispatch(completeOnboarding());
        }
    };

    if (!targetElement) {
        return null;
    }

    const targetRect = targetElement.getBoundingClientRect();

    const getTooltipPosition = (): React.CSSProperties => {
        const tooltip = { width: 320, height: 150 };
        const spacing = 16;
        let top = 0,
            left = 0;

        switch (currentStep.position) {
            case 'right':
                top = targetRect.top;
                left = targetRect.right + spacing;
                break;
            case 'left':
                top = targetRect.top;
                left = targetRect.left - tooltip.width - spacing;
                break;
            case 'bottom':
                top = targetRect.bottom + spacing;
                left = targetRect.left + targetRect.width / 2 - tooltip.width / 2;
                break;
            case 'top':
                top = targetRect.top - tooltip.height - spacing;
                left = targetRect.left + targetRect.width / 2 - tooltip.width / 2;
                break;
            default:
                return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', position: 'fixed' };
        }

        if (left < spacing) left = spacing;
        if (left + tooltip.width > window.innerWidth) left = window.innerWidth - tooltip.width - spacing;
        if (top < spacing) top = spacing;
        if (top + tooltip.height > window.innerHeight) top = window.innerHeight - tooltip.height - spacing;

        return { top: `${top}px`, left: `${left}px`, position: 'absolute' };
    };

    return (
        <FocusTrap active={true}>
            <div>
                <div className="fixed inset-0 bg-black/70" style={{ zIndex: Z_INDEX.ONBOARDING }} />
                {currentStep.targetKey !== 'body' && (
                    <div
                        className="absolute rounded-md transition-all duration-300 pointer-events-none"
                        style={{
                            top: `${targetRect.top - 4}px`,
                            left: `${targetRect.left - 4}px`,
                            width: `${targetRect.width + 8}px`,
                            height: `${targetRect.height + 8}px`,
                            boxShadow: `0 0 0 4px var(--color-highlight), 0 0 0 9999px rgba(0,0,0,0.7)`,
                            zIndex: Z_INDEX.ONBOARDING,
                        }}
                    />
                )}
                <div
                    className="bg-secondary p-4 rounded-lg border border-border-color w-80 shadow-2xl animate-fade-in"
                    style={{ ...getTooltipPosition(), zIndex: Z_INDEX.ONBOARDING + 2 }}
                    role="dialog"
                    aria-labelledby="onboarding-title"
                    aria-describedby="onboarding-content"
                >
                    <p id="onboarding-content" className="text-text-main mb-4">{t(currentStep.content)}</p>
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-text-secondary">
                            {stepIndex + 1} / {steps.length}
                        </span>
                        <div>
                            <button
                                onClick={() => dispatch(completeOnboarding())}
                                className="px-3 py-1 text-sm text-text-secondary hover:text-text-main"
                            >
                                {t('onboarding.skip')}
                            </button>
                            {currentStep.awaits === 'next_click' && (
                                <button
                                    onClick={handleNext}
                                    className="ml-2 px-3 py-1 text-sm font-semibold text-white bg-accent hover:bg-highlight rounded-md"
                                >
                                    {stepIndex === steps.length - 1 ? t('onboarding.finish') : t('onboarding.next')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </FocusTrap>
    );
};

export default OnboardingTutorial;