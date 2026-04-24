import { useEffect, useRef, useCallback, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

export function useTerminal(agentId: string | undefined) {
  const termRef = useRef<XTerm | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!agentId || !containerRef.current) return;

    const term = new XTerm({
      theme: { background: '#0c0c0c', foreground: '#e4e4e4', cursor: '#e4e4e4', selectionBackground: '#3f3f46' },
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 13,
      cursorBlink: true,
      scrollback: 10000,
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(containerRef.current);
    fit.fit();

    termRef.current = term;
    fitAddonRef.current = fit;
    setIsConnected(true);

    // Write a welcome message
    term.writeln('\x1b[2m\x1b[32mAgentForge Terminal\x1b[0m');
    term.writeln('\x1b[2mWaiting for agent output...\x1b[0m');

    const handleResize = () => { fit.fit(); };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
      termRef.current = null;
      fitAddonRef.current = null;
      setIsConnected(false);
    };
  }, [agentId]);

  const sendInput = useCallback((data: string) => {
    if (termRef.current) {
      termRef.current.write(data);
    }
  }, []);

  const writeOutput = useCallback((data: string) => {
    if (termRef.current) {
      termRef.current.write(data);
    }
  }, []);

  return { containerRef, isConnected, sendInput, writeOutput };
}
