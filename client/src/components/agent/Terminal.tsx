import { useEffect, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { useSocket } from '../../hooks/useSocket';
import type { AgentStatus } from '../../types';

interface Props {
  agentId: string;
  status?: AgentStatus;
}

export default function Terminal({ agentId, status }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<XTerm | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const { on, emit, connected } = useSocket();

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new XTerm({
      theme: { background: '#0c0c0c', foreground: '#e4e4e4', cursor: '#e4e4e4', selectionBackground: '#3f3f46', black: '#0c0c0c', red: '#ef4444', green: '#22c55e', yellow: '#f59e0b', blue: '#3b82f6', magenta: '#a855f7', cyan: '#06b6d4', white: '#e4e4e4', brightBlack: '#27272a', brightRed: '#f87171', brightGreen: '#4ade80', brightYellow: '#fbbf24', brightBlue: '#60a5fa', brightMagenta: '#c084fc', brightCyan: '#22d3ee', brightWhite: '#f4f4f5' },
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 13,
      cursorBlink: true,
      scrollback: 50000,
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(containerRef.current);
    fit.fit();
    term.focus();

    termRef.current = term;
    fitRef.current = fit;

    term.writeln('\x1b[1m\x1b[32mAgentForge Terminal\x1b[0m — Connected to agent');
    term.writeln('');

    // Handle user input
    const disposable = term.onData((data) => {
      emit('agent:terminal', { agentId, input: data });
    });

    const handleResize = () => {
      fit.fit();
      const dims = fit.proposeDimensions();
      if (dims) {
        emit('agent:terminal:resize', { agentId, cols: dims.cols, rows: dims.rows });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      disposable.dispose();
      term.dispose();
      termRef.current = null;
      fitRef.current = null;
    };
  }, [agentId, emit]);

  // Join the agent room + listen for output (including buffer replay on connect)
  useEffect(() => {
    if (!connected) return;
    emit('agent:connect', { agentId });

    const unsub = on('agent:output', ({ agentId: aid, data }: { agentId: string; data: string }) => {
      if (aid === agentId && termRef.current) {
        termRef.current.write(data);
      }
    });
    return () => {
      emit('agent:disconnect', { agentId });
      unsub?.();
    };
  }, [agentId, on, emit, connected]);

  return (
    <div className="flex flex-col h-full bg-[#0c0c0c] rounded-xl border border-zinc-800 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-red-500'}`} />
          <span className="text-xs text-zinc-400 font-mono">Terminal {connected ? 'Connected' : 'Disconnected'}</span>
        </div>
        <span className="text-xs text-zinc-600 font-mono">{agentId.slice(0, 8)}</span>
      </div>
      <div ref={containerRef} className="flex-1 p-1 relative">
        {status && status !== 'running' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
            <div className="text-center text-zinc-400">
              <p className="text-sm mb-2">Agent is <span className="text-zinc-200 font-medium">{status}</span></p>
              <p className="text-xs">Start the agent to use the terminal</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
