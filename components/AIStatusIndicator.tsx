"use client";

import { useEffect, useState } from "react";
import { getCurrentAIConfig, AI_MODE, getCachedWorkingModel } from "@/lib/ai-config";

interface AIInfo {
  mode: string;
  name: string;
  model: string;
  provider: string;
  cost: string;
}

function getAIInfo(): AIInfo {
  const config = getCurrentAIConfig();
  const cached = getCachedWorkingModel();

  return {
    mode: AI_MODE === 'server' ? 'server' : 'serverless',
    name: config.name,
    model: cached ? cached.model : config.defaultModel,
    provider: cached ? cached.provider : config.providers[0],
    cost: config.cost,
  };
}

export function AIStatusIndicator() {
  const [aiInfo, setAiInfo] = useState<AIInfo>(getAIInfo());
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Update AI info
    setAiInfo(getAIInfo());

    // Log to console
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🤖 AI STATUS INDICATOR');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Mode:', aiInfo.mode);
    console.log('Name:', aiInfo.name);
    console.log('Model:', aiInfo.model);
    console.log('Provider:', aiInfo.provider);
    console.log('Cost:', aiInfo.cost);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }, []);

  const isServerMode = aiInfo.mode === 'server';

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`
          bg-gradient-to-r shadow-lg rounded-lg overflow-hidden transition-all duration-300
          ${isServerMode
            ? 'from-green-600 to-teal-600'
            : 'from-purple-600 to-blue-600'
          }
          ${isExpanded ? 'w-80' : 'w-auto'}
        `}
      >
        {/* Compact View */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-2 text-white font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <div className="flex items-center gap-2 flex-1">
            <div className="w-2 h-2 bg-gradient-success rounded-full animate-pulse"></div>
            <span className="text-sm">
              🤖 {isServerMode ? 'Server' : 'Serverless'}
              {' • '}
              {aiInfo.provider}
            </span>
          </div>
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Expanded View */}
        {isExpanded && (
          <div className="bg-white text-gray-900 p-4 space-y-2 text-sm">
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">AI Provider</p>
              <p className="font-semibold">{aiInfo.name}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Model</p>
              <p className="font-mono text-xs break-all">{aiInfo.model}</p>
              <p className="text-green-600 font-semibold text-xs mt-1">
                ✅ Active
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Backend</p>
              <p className="font-semibold">{aiInfo.provider}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Cost</p>
              <p className="font-semibold">{aiInfo.cost}</p>
            </div>

            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Mode: <span className="font-mono font-semibold">{AI_MODE}</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Change in <code className="bg-gray-100 px-1 rounded">lib/ai-config.ts</code>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
