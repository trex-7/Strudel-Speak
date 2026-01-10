import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, Terminal, RefreshCw } from 'lucide-react';
import { openRouterService } from '../services/openRouterService';
import { InteractionLog } from '../types';

interface AdminConsoleProps {
  onClose: () => void;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({ onClose }) => {
  const [logs, setLogs] = useState<InteractionLog[]>([]);

  useEffect(() => {
    refreshLogs();
  }, []);

  const refreshLogs = () => {
    setLogs([...openRouterService.getLogs()]);
  };

  return (
    <div className="absolute inset-0 bg-[#000000] z-50 flex flex-col font-mono text-sm">
      {/* Header */}
      <div className="h-14 border-b border-gray-800 bg-[#121212] flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Terminal className="text-red-500" size={18} />
          <span className="font-bold text-gray-200">STRUDEL::ADMIN_CONSOLE</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={refreshLogs} className="text-gray-400 hover:text-white transition-colors">
            <RefreshCw size={16} />
          </button>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Log List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {logs.length === 0 ? (
           <div className="text-gray-600 text-center mt-20">NO LOGS AVAILABLE</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="bg-[#18181b] border border-gray-800 rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-[#202023] flex items-center justify-between border-b border-gray-800">
                 <div className="flex items-center gap-3">
                    {log.status === 'success' ? (
                        <CheckCircle size={16} className="text-green-500" />
                    ) : (
                        <XCircle size={16} className="text-red-500" />
                    )}
                    <span className="text-gray-300 font-bold">{log.userPrompt}</span>
                 </div>
                 <div className="text-xs text-gray-500">
                    {log.model && <span className="text-blue-400 mr-2">[{log.model}]</span>}
                    {new Date(log.timestamp).toLocaleTimeString()} • Chaos: {log.chaosLevel}
                 </div>
              </div>
              
              <div className="p-4 space-y-4">
                 {log.attempts.map((attempt, idx) => (
                    <div key={idx} className="text-xs border-l-2 pl-4 py-1 border-gray-700">
                        <div className="flex justify-between text-gray-400 mb-1">
                            <span>ATTEMPT #{attempt.attemptNumber}</span>
                            <span className={attempt.isValid ? 'text-green-500' : 'text-red-500'}>
                                {attempt.isValid ? 'VALID' : 'INVALID'}
                            </span>
                        </div>
                        {attempt.error && (
                            <div className="text-red-400 mb-2 font-semibold bg-red-900/10 p-2 rounded">
                                Error: {attempt.error}
                            </div>
                        )}
                        <pre className="text-gray-500 overflow-x-auto whitespace-pre-wrap bg-black/30 p-2 rounded">
                            {attempt.generatedCode}
                        </pre>
                    </div>
                 ))}
                 
                 {log.finalCode && (
                     <div className="mt-4 pt-4 border-t border-gray-800">
                         <div className="text-green-400 mb-2 font-bold">FINAL RESULT</div>
                         <pre className="text-green-100 bg-green-900/10 p-3 rounded overflow-x-auto whitespace-pre-wrap">
                             {log.finalCode}
                         </pre>
                     </div>
                 )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
