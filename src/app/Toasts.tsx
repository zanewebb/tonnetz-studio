import { useState } from 'react';

export type Toast = { id: string; message: string };
export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  function push(message: string) {
    const id = String(Math.random());
    setToasts((t) => [...t, { id, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }
  return { toasts, push };
}

export function ToastList({ toasts }: { toasts: Toast[] }) {
  return (
    <div style={{ position: 'fixed', bottom: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {toasts.map((t) => (
        <div key={t.id} style={{ background: '#222', color: 'white', padding: '8px 12px', borderRadius: 4 }}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
