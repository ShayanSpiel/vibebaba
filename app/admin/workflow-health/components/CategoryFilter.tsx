'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CategoryFilterProps {
  timeframe: string;
  onTimeframeChange: (value: string) => void;
  nodeFilter?: string;
  onNodeFilterChange?: (value: string) => void;
  showNodeFilter?: boolean;
}

export function CategoryFilter({
  timeframe,
  onTimeframeChange,
  nodeFilter = 'all',
  onNodeFilterChange,
  showNodeFilter = false,
}: CategoryFilterProps) {
  return (
    <div className="flex gap-4 flex-wrap">
      <div className="flex-1 min-w-[200px]">
        <label className="text-sm text-text-secondary mb-2 block">Timeframe</label>
        <Select value={timeframe} onValueChange={onTimeframeChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1h">Last Hour</SelectItem>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {showNodeFilter && onNodeFilterChange && (
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm text-text-secondary mb-2 block">Node</label>
          <Select value={nodeFilter} onValueChange={onNodeFilterChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Nodes</SelectItem>
              <SelectItem value="founder">Founder</SelectItem>
              <SelectItem value="pm">Product Manager</SelectItem>
              <SelectItem value="ux">UX Designer</SelectItem>
              <SelectItem value="frontend">Frontend</SelectItem>
              <SelectItem value="backend">Backend</SelectItem>
              <SelectItem value="qa">QA</SelectItem>
              <SelectItem value="devops">DevOps</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
              <SelectItem value="input_detector">Input Detector</SelectItem>
              <SelectItem value="context_analyzer">Context Analyzer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
