'use client';

import { useEffect, useState } from 'react';

interface PrototypeViewProps {
  projectId: string;
  project: any;
  onUpdateProject: (updates: any) => void;
}

export default function PrototypeView({ projectId, project, onUpdateProject }: PrototypeViewProps) {
  const [code, setCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (project.prototype) {
      setCode(project.prototype);
    } else {
      generatePrototype();
    }
  }, []);

  const generatePrototype = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/prototype', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: project.plan,
          description: project.description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `API error: ${response.status}`);
      }

      setCode(data.code);
      onUpdateProject({ prototype: data.code });
    } catch (err: any) {
      console.error('Error generating prototype:', err);
      setError(err.message || 'Failed to generate prototype');
    } finally {
      setIsGenerating(false);
    }
  };

  if (error) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2 tracking-tight">Vibebaba</h1>
          <p className="text-lg text-text-secondary">Design Stage</p>
        </div>

        <div className="border border-error rounded-xl p-6 bg-error/10">
          <p className="text-error font-semibold mb-4">{error}</p>
          <button
            onClick={generatePrototype}
            className="px-6 py-3 bg-gradient-to-r from-amber-400 to-yellow-600 text-text-inverse rounded-xl hover:bg-gradient-to-r from-amber-500 to-yellow-700 font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold mb-2 tracking-tight">Vibebaba</h1>
        <p className="text-lg text-text-secondary">
          {isGenerating ? 'Generating prototype...' : 'Frontend Prototype'}
        </p>
      </div>

      {isGenerating ? (
        <div className="border border-light rounded-xl p-12 bg-background-raised flex flex-col items-center justify-center min-h-[500px]">
          <div className="w-16 h-16 border-4 border-default border-t-brand-primary rounded-full animate-spin mb-6"></div>
          <p className="text-text-secondary text-xl font-semibold">
            Generating your frontend prototype...
          </p>
          <p className="text-text-tertiary text-sm mt-2">This may take 30-60 seconds</p>
        </div>
      ) : code ? (
        <>
          {/* Live Preview */}
          <div className="border border-light rounded-xl overflow-hidden bg-background-raised">
            <div className="bg-background-raised border-b border-light px-6 py-3">
              <h3 className="font-bold text-lg text-text-primary">Live Preview</h3>
            </div>
            <div className="p-6 min-h-[500px]">
              <iframe
                srcDoc={code}
                className="w-full h-[600px] border border-default rounded-lg bg-background-raised"
                title="App Preview"
                sandbox="allow-scripts"
              />
            </div>
          </div>

          {/* Code View */}
          <details className="border border-light rounded-xl bg-background-raised">
            <summary className="cursor-pointer px-6 py-4 font-bold text-lg hover:bg-background-subtle text-text-primary">
              View Generated Code
            </summary>
            <div className="border-t border-light p-6">
              <pre className="bg-background-sunken text-brand-primary p-6 rounded-lg overflow-auto text-sm">
                <code>{code}</code>
              </pre>
            </div>
          </details>

          {/* Actions */}
          <div className="border border-light rounded-xl p-6 bg-background-raised">
            <h3 className="text-lg font-bold mb-4 text-text-primary">Next Steps</h3>
            <div className="flex gap-4">
              <button
                onClick={generatePrototype}
                className="flex-1 px-6 py-4 border border-default bg-background-subtle rounded-xl hover:bg-background-overlay font-semibold text-lg transition-colors text-text-primary"
              >
                Regenerate Prototype
              </button>
              <button
                className="flex-1 px-6 py-4 bg-gradient-to-r from-amber-400 to-yellow-600 text-text-inverse rounded-xl hover:bg-gradient-to-r from-amber-500 to-yellow-700 font-semibold text-lg transition-colors"
                onClick={() => alert('Backend integration coming soon!')}
              >
                Add Backend →
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="border border-light rounded-xl p-12 bg-background-raised text-center">
          <p className="text-text-secondary">No prototype generated yet</p>
        </div>
      )}
    </div>
  );
}
