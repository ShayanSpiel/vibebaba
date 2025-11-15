'use client';

import { useEffect, useState } from 'react';
import PrototypeView from './PrototypeView';

interface PlanViewProps {
  projectId: string;
  project: any;
  onUpdateProject: (updates: any) => void;
}

export default function PlanView({ projectId, project, onUpdateProject }: PlanViewProps) {
  const [planText, setPlanText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (project.plan) {
      setPlanText(project.plan);
    } else if (project.stage === 'planning') {
      generatePlan();
    }
  }, []);

  const generatePlan = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: project.description }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `API error: ${response.status}`);
      }

      setPlanText(data.plan);
      onUpdateProject({ plan: data.plan });
    } catch (err: any) {
      console.error('Error generating plan:', err);
      setError(err.message || 'Failed to generate plan');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirm = () => {
    onUpdateProject({ stage: 'design' });
  };

  // Show prototype view if in design stage
  if (project.stage === 'design') {
    return (
      <PrototypeView projectId={projectId} project={project} onUpdateProject={onUpdateProject} />
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2 tracking-tight">Vibebaba</h1>
          <p className="text-lg text-text-secondary">Planning Stage</p>
        </div>

        <div className="border border-error rounded-xl p-6 bg-error/10">
          <p className="text-error font-semibold mb-4">{error}</p>
          <button
            onClick={generatePlan}
            className="px-6 py-3 bg-gradient-to-r from-amber-400 to-yellow-600 text-text-inverse rounded-xl hover:bg-gradient-to-r from-amber-500 to-yellow-700 font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold mb-2 tracking-tight">Vibebaba</h1>
        <p className="text-lg text-text-secondary">
          {isGenerating ? 'Generating plan...' : 'Planning Stage'}
        </p>
      </div>

      {/* Generated Plan */}
      <div className="border border-light rounded-xl p-8 bg-background-raised min-h-[400px]">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-default border-t-brand-primary rounded-full animate-spin mb-4"></div>
            <p className="text-text-secondary text-lg">AI is planning your app...</p>
          </div>
        ) : planText ? (
          <>
            <h2 className="text-2xl font-bold mb-6 text-text-primary">App Plan</h2>
            <pre className="whitespace-pre-wrap text-base leading-relaxed text-text-secondary">
              {planText}
            </pre>
          </>
        ) : (
          <p className="text-text-secondary text-center">Waiting for plan...</p>
        )}
      </div>

      {/* Actions */}
      {!isGenerating && planText && (
        <div className="border border-light rounded-xl p-6 bg-background-raised">
          <h3 className="text-lg font-bold mb-4 text-text-primary">Ready to proceed?</h3>
          <div className="flex gap-4">
            <button className="flex-1 px-6 py-4 border border-default bg-background-subtle rounded-xl hover:bg-background-overlay font-semibold text-lg transition-colors text-text-primary">
              ← Continue Planning
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-amber-400 to-yellow-600 text-text-inverse rounded-xl hover:bg-gradient-to-r from-amber-500 to-yellow-700 font-semibold text-lg transition-colors"
            >
              Confirm & Generate Prototype →
            </button>
          </div>
          <p className="text-sm text-text-secondary mt-4 text-center">
            Use the chat to refine the plan, or confirm to generate the frontend prototype
          </p>
        </div>
      )}
    </div>
  );
}
