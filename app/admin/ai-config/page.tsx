'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Server, Cloud, Trash2, Play, CheckCircle2, XCircle, Clock, Zap } from 'lucide-react';

interface AIConfig {
  mode: 'serverless' | 'server';
  activeProviders: string[];
  cachedModel: string | null;
  cacheAge: number | null;
}

interface TestResult {
  text: string;
  provider: string;
  model: string;
  tokenCount?: number;
  duration: number;
  attemptsLog: string[];
}

export default function AiConfigPage() {
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testPrompt, setTestPrompt] = useState('Hello! Please respond with a short greeting.');

  // Fetch current configuration
  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/admin/ai-config');
      const data = await response.json();

      if (data.success) {
        setConfig(data.data);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Switch AI mode
  const switchMode = async (newMode: 'serverless' | 'server') => {
    setSwitching(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: newMode }),
      });

      const data = await response.json();

      if (data.success) {
        setConfig(data.data);
        setTestResult(null); // Clear old test results
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSwitching(false);
    }
  };

  // Clear cache
  const clearCache = async () => {
    try {
      const response = await fetch('/api/admin/ai-config', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await fetchConfig();
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Test AI generation
  const testAI = async () => {
    setTesting(true);
    setError(null);
    setTestResult(null);

    try {
      const response = await fetch('/api/admin/ai-config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: testPrompt }),
      });

      const data = await response.json();

      if (data.success) {
        setTestResult(data.data);
        await fetchConfig(); // Refresh to show updated cache
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-text-secondary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Configuration</h1>
        <p className="text-text-secondary">
          Manage AI providers, test models, and monitor cache status
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive rounded-md flex items-center gap-3 mb-6">
          <XCircle className="h-4 w-4 text-destructive" />
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="testing">Test AI</TabsTrigger>
          <TabsTrigger value="models">Models Info</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Mode Switcher */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                AI Mode
              </CardTitle>
              <CardDescription>
                Switch between serverless and server-based AI execution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Serverless Card */}
                <button
                  onClick={() => switchMode('serverless')}
                  disabled={switching || config?.mode === 'serverless'}
                  className={`p-6 rounded-lg border-2 transition-all text-left ${
                    config?.mode === 'serverless'
                      ? 'border-brand-primary bg-brand-primary-subtle'
                      : 'border-border-light hover:border-brand-primary/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <Cloud className="h-6 w-6 text-primary" />
                    {config?.mode === 'serverless' && (
                      <Badge variant="default">Active</Badge>
                    )}
                  </div>
                  <h3 className="font-semibold mb-2">Serverless</h3>
                  <p className="text-sm text-text-secondary mb-3">
                    Browser-based execution via Puter and HuggingFace
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs">Puter</Badge>
                    <Badge variant="outline" className="text-xs">HuggingFace</Badge>
                  </div>
                </button>

                {/* Server Card */}
                <button
                  onClick={() => switchMode('server')}
                  disabled={switching || config?.mode === 'server'}
                  className={`p-6 rounded-lg border-2 transition-all text-left ${
                    config?.mode === 'server'
                      ? 'border-brand-primary bg-brand-primary-subtle'
                      : 'border-border-light hover:border-brand-primary/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <Server className="h-6 w-6 text-primary" />
                    {config?.mode === 'server' && (
                      <Badge variant="default">Active</Badge>
                    )}
                  </div>
                  <h3 className="font-semibold mb-2">Server</h3>
                  <p className="text-sm text-text-secondary mb-3">
                    Server-side execution with 58 free models
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs">Gemini</Badge>
                    <Badge variant="outline" className="text-xs">OpenRouter</Badge>
                    <Badge variant="outline" className="text-xs">Groq</Badge>
                  </div>
                </button>
              </div>

              {switching && (
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Switching mode...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cache Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Cache Status
              </CardTitle>
              <CardDescription>
                Model caching improves performance by reusing working models
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="text-sm text-text-secondary mb-1">Cached Model</div>
                  <div className="font-mono text-sm">
                    {config?.cachedModel || (
                      <span className="text-text-secondary">None</span>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="text-sm text-text-secondary mb-1">Cache Age</div>
                  <div className="font-mono text-sm">
                    {config?.cacheAge !== null && config?.cacheAge !== undefined ? (
                      <span>{config.cacheAge}s</span>
                    ) : (
                      <span className="text-text-secondary">N/A</span>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="text-sm text-text-secondary mb-1">Status</div>
                  <div className="flex items-center gap-2">
                    {config?.cachedModel ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        <span className="text-sm font-medium">Active</span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4 text-text-secondary" />
                        <span className="text-sm font-medium text-text-secondary">Empty</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <Button
                onClick={clearCache}
                variant="outline"
                size="sm"
                disabled={!config?.cachedModel}
                className="w-full md:w-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Cache
              </Button>

              {config?.cachedModel && (
                <div className="p-4 bg-success/10 border border-success rounded-md flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-success" />
                  <p className="text-sm">
                    System is using cached model <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">{config.cachedModel}</code> for faster responses
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Providers */}
          <Card>
            <CardHeader>
              <CardTitle>Active Providers</CardTitle>
              <CardDescription>
                Providers available in {config?.mode} mode
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {config?.activeProviders.map((provider) => (
                  <Badge key={provider} variant="secondary" className="text-sm px-3 py-1">
                    {provider}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Testing Tab */}
        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Test AI Generation
              </CardTitle>
              <CardDescription>
                Send a test prompt to verify AI configuration and performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Test Prompt</label>
                <textarea
                  value={testPrompt}
                  onChange={(e) => setTestPrompt(e.target.value)}
                  className="w-full min-h-[100px] p-3 rounded-lg border bg-background resize-y"
                  placeholder="Enter your test prompt..."
                />
              </div>

              <Button
                onClick={testAI}
                disabled={testing || !testPrompt.trim()}
                className="w-full md:w-auto"
              >
                {testing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run Test
                  </>
                )}
              </Button>

              {testResult && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                      <div className="text-xs text-success mb-1">Provider</div>
                      <div className="font-semibold text-success">{testResult.provider}</div>
                    </div>

                    <div className="p-3 rounded-lg bg-info/10 border border-info/20">
                      <div className="text-xs text-info mb-1">Model</div>
                      <div className="font-semibold text-info text-sm truncate">{testResult.model}</div>
                    </div>

                    <div className="p-3 rounded-lg bg-brand-primary/10 border border-brand-primary/20">
                      <div className="text-xs text-brand-primary mb-1">Duration</div>
                      <div className="font-semibold text-brand-primary">{testResult.duration}ms</div>
                    </div>

                    {testResult.tokenCount && (
                      <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                        <div className="text-xs text-warning mb-1">Tokens</div>
                        <div className="font-semibold text-warning">{testResult.tokenCount}</div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-lg bg-muted">
                    <div className="text-sm font-medium mb-2">Response:</div>
                    <p className="text-sm">{testResult.text}</p>
                  </div>

                  <details className="text-sm">
                    <summary className="cursor-pointer font-medium mb-2">View Attempts Log</summary>
                    <div className="mt-2 p-3 rounded-lg bg-muted font-mono text-xs space-y-1">
                      {testResult.attemptsLog.map((log, i) => (
                        <div key={i} className={log.includes('✅') ? 'text-success' : log.includes('❌') ? 'text-error' : ''}>
                          {log}
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Models Info Tab */}
        <TabsContent value="models" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Models</CardTitle>
              <CardDescription>
                68 free models across all providers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Gemini */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Badge variant="outline">Gemini</Badge>
                  <span className="text-sm text-text-secondary">27 models</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div className="p-2 rounded bg-muted/50">2.5 Flash, Pro, Lite variants</div>
                  <div className="p-2 rounded bg-muted/50">2.0 Flash, Lite, Image Gen</div>
                  <div className="p-2 rounded bg-muted/50">1.5 Flash, Pro variants</div>
                  <div className="p-2 rounded bg-muted/50">Gemma 27B/12B/4B/2B/1B</div>
                </div>
              </div>

              {/* OpenRouter */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Badge variant="outline">OpenRouter</Badge>
                  <span className="text-sm text-text-secondary">21 models</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div className="p-2 rounded bg-muted/50">Qwen3 235B, DeepSeek R1</div>
                  <div className="p-2 rounded bg-muted/50">Llama 3.3 70B, Kimi 72B</div>
                  <div className="p-2 rounded bg-muted/50">Qwen Coder 32B, Gemma 27B</div>
                  <div className="p-2 rounded bg-muted/50">Mistral Small 24B, GPT-OSS</div>
                </div>
              </div>

              {/* Groq */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Badge variant="outline">Groq</Badge>
                  <span className="text-sm text-text-secondary">10 models</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div className="p-2 rounded bg-muted/50">Llama 3.3 70B (ultra-fast)</div>
                  <div className="p-2 rounded bg-muted/50">Llama 3.1 8B Instant</div>
                  <div className="p-2 rounded bg-muted/50">Llama 4 Maverick/Scout</div>
                  <div className="p-2 rounded bg-muted/50">Groq Compound Systems</div>
                </div>
              </div>

              {/* HuggingFace */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Badge variant="outline">HuggingFace</Badge>
                  <span className="text-sm text-text-secondary">10 models</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div className="p-2 rounded bg-muted/50">Llama 3.3/3.1 70B</div>
                  <div className="p-2 rounded bg-muted/50">Qwen 2.5 72B</div>
                  <div className="p-2 rounded bg-muted/50">Mixtral 8x7B, Mistral 7B</div>
                  <div className="p-2 rounded bg-muted/50">Phi-3, Gemma 2 variants</div>
                </div>
              </div>

              <div className="p-4 bg-muted border rounded-md flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 mt-0.5" />
                <p className="text-sm">
                  All models are completely free with reasonable rate limits. The system automatically tries models in order of capability until one succeeds.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
