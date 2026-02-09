/**
 * @scope VISUAL ONLY - Presentation Layer
 * Progressive disclosure component.
 *
 * ⚠️ BOUNDARIES:
 * - Content ALWAYS in DOM (not conditionally rendered)
 * - No API calls on expand/collapse
 * - No analytics tracking
 *
 * ⚠️ COMPLIANCE:
 * - Legal text must remain visible in DOM
 *
 * @see /docs/UI-AMENDMENTS.md
 */

'use client';

import { ReactNode, useState, useEffect } from 'react';
import { ChevronDown, CheckCircle2, Circle } from 'lucide-react';

export interface StepCardItem {
  /**
   * Unique identifier for the step
   */
  id: string;

  /**
   * Step number or title
   */
  title: string | ReactNode;

  /**
   * Step description or summary
   */
  description?: string | ReactNode;

  /**
   * Detailed content shown when expanded
   */
  details?: ReactNode;

  /**
   * Optional icon element
   */
  icon?: ReactNode;

  /**
   * Whether this step is completed
   */
  completed?: boolean;

  /**
   * Optional status badge text
   */
  status?: string;
}

interface StepCardsProps {
  /**
   * Array of step items
   */
  steps: StepCardItem[];

  /**
   * Index of currently active/selected step
   */
  currentStep?: number;

  /**
   * Callback when step is clicked
   */
  onStepClick?: (stepIndex: number, stepId: string) => void;

  /**
   * Allow multiple steps to be expanded
   */
  allowMultiple?: boolean;

  /**
   * CSS class for container
   */
  className?: string;

  /**
   * Show step numbers
   */
  showStepNumbers?: boolean;

  /**
   * Show timeline connector between steps
   */
  showTimeline?: boolean;
}

/**
 * StepCards
 *
 * Timeline/process step cards with expandable details.
 * Each step displays:
 * - Icon (optional) or step number
 * - Title and description
 * - Expandable details panel
 * - Status badge (optional)
 *
 * Content is always in DOM for accessibility and compliance.
 *
 * @example
 * ```tsx
 * <StepCards
 *   steps={[
 *     { id: '1', title: 'Step 1', description: 'Do this first', details: <p>Details</p> },
 *     { id: '2', title: 'Step 2', description: 'Do this second', details: <p>Details</p> },
 *   ]}
 *   currentStep={0}
 *   onStepClick={(index) => console.log('Step clicked:', index)}
 *   showStepNumbers
 *   showTimeline
 * />
 * ```
 */
export function StepCards({
  steps,
  currentStep = 0,
  onStepClick,
  allowMultiple = false,
  className = '',
  showStepNumbers = true,
  showTimeline = true,
}: StepCardsProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(() => {
    return new Set([currentStep]);
  });

  const [mounted, setMounted] = useState(false);

  // Hydration fix for SSR
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleStepClick = (index: number) => {
    const newExpandedSteps = new Set(expandedSteps);

    if (newExpandedSteps.has(index)) {
      newExpandedSteps.delete(index);
    } else {
      if (!allowMultiple) {
        newExpandedSteps.clear();
      }
      newExpandedSteps.add(index);
    }

    setExpandedSteps(newExpandedSteps);
    onStepClick?.(index, steps[index].id);
  };

  if (!mounted) {
    return (
      <div className={`space-y-4 ${className}`}>
        {steps.map((step, index) => (
          <div key={step.id} className="bg-white border border-slate-200 rounded-lg p-5">
            <div className="flex gap-4">
              <div className="flex-shrink-0 mt-1">
                {step.icon || (
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium text-slate-600">
                    {showStepNumbers ? index + 1 : '.'}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900">{step.title}</h3>
                {step.description && (
                  <p className="text-sm text-slate-600 mt-1">{step.description}</p>
                )}
              </div>
              {step.status && (
                <div className="flex-shrink-0 text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded">
                  {step.status}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {steps.map((step, index) => {
        const isExpanded = expandedSteps.has(index);
        const isActive = index === currentStep;
        const isCompleted = step.completed || index < currentStep;

        return (
          <div
            key={step.id}
            className={`bg-white border rounded-lg overflow-hidden transition-all duration-200 ${
              isActive
                ? 'border-blue-300 shadow-md'
                : 'border-slate-200'
            }`}
          >
            {/* Timeline connector (only show between items) */}
            {showTimeline && index < steps.length - 1 && !isExpanded && (
              <div className="h-0 border-l border-slate-200 ml-6" />
            )}

            {/* Step header */}
            <button
              type="button"
              onClick={() => handleStepClick(index)}
              className={`w-full px-5 py-4 flex items-start gap-4 transition-colors ${
                isActive
                  ? 'bg-blue-50 hover:bg-blue-100'
                  : 'bg-white hover:bg-slate-50'
              }`}
              aria-expanded={isExpanded}
            >
              {/* Step indicator */}
              <div className="flex-shrink-0 mt-0.5">
                {step.icon ? (
                  step.icon
                ) : isCompleted ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                ) : (
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {showStepNumbers ? index + 1 : ''}
                  </div>
                )}
              </div>

              {/* Step content */}
              <div className="flex-1 min-w-0 text-left">
                <h3
                  className={`font-semibold transition-colors ${
                    isActive ? 'text-blue-900' : 'text-slate-900'
                  }`}
                >
                  {step.title}
                </h3>
                {step.description && (
                  <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                    {step.description}
                  </p>
                )}
              </div>

              {/* Status badge and chevron */}
              <div className="flex items-center gap-3 flex-shrink-0">
                {step.status && (
                  <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded font-medium">
                    {step.status}
                  </span>
                )}
                {step.details && (
                  <div
                    className={`text-slate-400 transition-transform duration-300 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  >
                    <ChevronDown className="w-5 h-5" />
                  </div>
                )}
              </div>
            </button>

            {/* Expanded details - Always in DOM */}
            {step.details && (
              <div
                className="overflow-hidden transition-all duration-300 ease-out"
                style={{
                  maxHeight: isExpanded ? '1500px' : '0px',
                  opacity: isExpanded ? 1 : 0,
                }}
              >
                <div className="border-t border-slate-200 px-5 py-4 bg-slate-50">
                  {step.details}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * StepProgress
 *
 * Horizontal step progress indicator (complement to StepCards)
 */
export function StepProgress({
  steps,
  currentStep = 0,
  onStepClick,
  className = '',
}: {
  steps: StepCardItem[];
  currentStep?: number;
  onStepClick?: (stepIndex: number, stepId: string) => void;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;

        return (
          <div key={step.id} className="flex items-center flex-1">
            {/* Step indicator */}
            <button
              type="button"
              onClick={() => onStepClick?.(index, step.id)}
              className={`relative w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                isCompleted
                  ? 'bg-green-600 text-white'
                  : isActive
                  ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                index + 1
              )}
            </button>

            {/* Connector */}
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-2 transition-colors ${
                  isCompleted ? 'bg-green-600' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
