import { useState, useCallback } from 'react';

interface DeploymentState {
  status: 'idle' | 'deploying' | 'deployed' | 'failed';
  url?: string;
  databaseUrl?: string;
  error?: string;
  filesDeployed?: number;
  allFiles?: ProjectFile[];
}

interface ProjectFile {
  path: string;
  content: string;
}

export function useDeployment(projectId: string) {
  const [state, setState] = useState<DeploymentState>({
    status: 'idle'
  });

  const deploy = useCallback(async (
    files: ProjectFile[],
    backendConfig?: any
  ) => {
    if (!files || files.length === 0) {
      console.warn('⚠️  No files to deploy');
      return;
    }

    console.log(`[useDeployment] 🚀 Setting status to 'deploying' for project ${projectId} with ${files.length} files...`);
    setState({ status: 'deploying' });
    console.log(`[useDeployment] ✅ State updated to 'deploying'`);

    try {
      // Check if deployment server is running (with timeout)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

      const healthCheck = await fetch('http://localhost:4000/health', {
        method: 'GET',
        signal: controller.signal
      }).catch((err) => {
        // Silently fail for network errors (don't log to console)
        return null;
      }).finally(() => clearTimeout(timeoutId));

      if (!healthCheck || !healthCheck.ok) {
        console.warn('⚠️  Deployment server is not running. Please start it with: cd deployment-server && npm run dev');
        console.log('📝 Files are ready but not deployed. You can still preview them locally.');
        setState({
          status: 'failed',
          error: 'Deployment server not running'
        });
        return;
      }

      const response = await fetch(`http://localhost:4000/deploy/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files,
          backendConfig
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        console.log(`✅ Deployment successful: ${data.url}`);
        setState({
          status: 'deployed',
          url: data.url,
          databaseUrl: data.databaseUrl,
          filesDeployed: data.filesDeployed,
          allFiles: data.files // Include scaffold + user files
        });
      } else {
        console.error('❌ Deployment failed:', data.error);
        setState({
          status: 'failed',
          error: data.error || 'Deployment failed'
        });
      }
    } catch (error: any) {
      const errorMessage = error.message || String(error);
      console.error('❌ Deployment error:', errorMessage);

      // Provide helpful error messages
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('ECONNREFUSED')) {
        console.warn('💡 Tip: Make sure the deployment server is running on port 4000');
        console.warn('   Run: cd deployment-server && npm run dev');
      }

      setState({
        status: 'failed',
        error: errorMessage
      });
    }
  }, [projectId]);

  const reset = useCallback(() => {
    setState({ status: 'idle' });
  }, []);

  return {
    ...state,
    deploy,
    reset,
    isDeploying: state.status === 'deploying',
    isDeployed: state.status === 'deployed',
    hasFailed: state.status === 'failed'
  };
}
