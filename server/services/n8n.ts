import axios from 'axios';

class N8nService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.N8N_BASE_URL || 'http://localhost:5678';
    this.apiKey = process.env.N8N_API_KEY || '';
  }

  async triggerWorkflow(workflowId: string, data: any): Promise<{executionId: string}> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/v1/workflows/${workflowId}/execute`,
        {
          data: data
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        executionId: response.data.executionId || response.data.id
      };
    } catch (error) {
      console.error('Error triggering n8n workflow:', error);
      throw new Error('Failed to trigger workflow');
    }
  }

  async getExecutionStatus(executionId: string): Promise<{status: string, finished: boolean}> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/v1/executions/${executionId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      const execution = response.data;
      return {
        status: execution.status || 'unknown',
        finished: execution.finished || false
      };
    } catch (error) {
      console.error('Error getting execution status:', error);
      return { status: 'error', finished: true };
    }
  }

  async downloadExecutionResult(executionId: string): Promise<Buffer | null> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/v1/executions/${executionId}/binary-data`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          },
          responseType: 'arraybuffer'
        }
      );

      return Buffer.from(response.data);
    } catch (error) {
      console.error('Error downloading execution result:', error);
      return null;
    }
  }
}

export const n8nService = new N8nService();
