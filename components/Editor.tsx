import React from 'react';
import { Download } from 'lucide-react';
import { vscodeService } from '../services/vscodeService';

interface EditorProps {
  code: string;
  onChange: (code: string) => void;
  readOnly?: boolean;
}

export const Editor: React.FC<EditorProps> = ({ code, onChange, readOnly }) => {
  const isVSCode = vscodeService.getIsConnected();

  const handleInsert = () => {
    vscodeService.insertCode(code);
  };

  return (
    <div className="w-full h-full bg-[#1e1e1e] rounded-lg overflow-hidden border border-gray-700 shadow-inner flex flex-col">
      <div className="bg-[#252526] px-4 py-2 text-xs text-gray-400 border-b border-gray-700 font-mono flex justify-between items-center">
        <div className="flex gap-4">
            <span>main.strudel</span>
            <span className="text-purple-400">STRUDEL</span>
        </div>
        {isVSCode && (
            <button 
                onClick={handleInsert}
                className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                title="Insert code into VS Code active editor"
            >
                <Download size={12} />
                <span>INSERT TO DOC</span>
            </button>
        )}
      </div>
      <textarea
        className="flex-1 w-full h-full bg-[#1e1e1e] text-blue-300 font-mono text-sm p-4 resize-none focus:outline-none leading-relaxed"
        value={code}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        readOnly={readOnly}
        placeholder="// Strudel code will appear here..."
      />
    </div>
  );
};
