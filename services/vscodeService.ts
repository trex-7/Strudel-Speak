import { VSCodeApi } from '../types';

class VSCodeService {
  private vscode: VSCodeApi | null = null;
  private isConnected: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && (window as any).acquireVsCodeApi) {
      try {
        this.vscode = (window as any).acquireVsCodeApi();
        this.isConnected = true;
        console.log('VS Code Bridge: Connected');
      } catch (e) {
        console.error('VS Code Bridge: Failed to acquire API', e);
      }
    }
  }

  public getIsConnected() {
    return this.isConnected;
  }

  public postMessage(type: string, payload: any) {
    if (this.vscode) {
      this.vscode.postMessage({
        type,
        payload
      });
    }
  }

  /**
   * Sends the current pattern code to the VS Code host to be inserted into the active document
   */
  public insertCode(code: string) {
    this.postMessage('insertCode', { code });
  }

  /**
   * Persist state to VS Code extension context
   */
  public saveState(state: any) {
    if (this.vscode) {
      this.vscode.setState(state);
    }
  }

  public getState() {
    if (this.vscode) {
      return this.vscode.getState();
    }
    return null;
  }
}

export const vscodeService = new VSCodeService();
