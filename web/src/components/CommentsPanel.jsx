import { useState } from 'react';
import { api } from '../lib/api.js';

// Panel de observaciones/comentarios sobre un campo del formulario, similar
// a los comentarios de Word/Google Docs. Se usa dentro de FormRenderer.
export default function CommentsPanel({ documentId, fieldId, comments, projectUsers, canComment, canResolve, onChange }) {
  const [text, setText] = useState('');
  const [mentionId, setMentionId] = useState('');
  const [sending, setSending] = useState(false);

  const fieldComments = (comments || []).filter((c) => c.field_id === fieldId);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await api.post(`/documents/${documentId}/comments`, {
        field_id: fieldId,
        text,
        mentions: mentionId ? [mentionId] : [],
      });
      setText('');
      setMentionId('');
      onChange?.();
    } finally {
      setSending(false);
    }
  };

  const resolve = async (commentId, resolved) => {
    await api.put(`/documents/${documentId}/comments`, { comment_id: commentId, resolved });
    onChange?.();
  };

  if (!canComment && fieldComments.length === 0) return null;

  return (
    <div className="mt-2 border border-deepViolet/10 rounded-lg bg-white/60 p-2 text-xs space-y-2">
      {fieldComments.map((c) => (
        <div key={c.id} className={`p-2 rounded-md ${c.resolved ? 'bg-activeMint/10' : 'bg-warmAmber-light'}`}>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-deepViolet">{c.author_nombre}</span>
            {canResolve && (
              <button
                onClick={() => resolve(c.id, !c.resolved)}
                className="text-[10px] font-semibold underline text-cognitiveTeal"
              >
                {c.resolved ? 'Reabrir' : 'Marcar resuelto'}
              </button>
            )}
          </div>
          <p className="text-slate-700 mt-0.5">{c.text}</p>
          {c.resolved && <span className="text-emerald-700 font-semibold">Resuelto</span>}
        </div>
      ))}

      {canComment && (
        <div className="flex flex-col gap-1 pt-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Añadir observación..."
            className="w-full border border-deepViolet/20 rounded-md p-1.5 text-xs"
            rows={2}
          />
          <div className="flex gap-2 items-center">
            {projectUsers?.length > 0 && (
              <select
                value={mentionId}
                onChange={(e) => setMentionId(e.target.value)}
                className="border border-deepViolet/20 rounded-md text-xs p-1"
              >
                <option value="">Etiquetar a...</option>
                {projectUsers.map((u) => (
                  <option key={u.profiles.id} value={u.profiles.id}>
                    {u.profiles.nombre} {u.profiles.apellido}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={send}
              disabled={sending}
              className="ml-auto px-2.5 py-1 rounded-md bg-deepViolet text-white font-semibold disabled:opacity-50"
            >
              Comentar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
