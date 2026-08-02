import { useEffect, useRef, useState } from 'react';
import { Send, ShoppingCart, MessageSquare, Trash2, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { playClick } from '@/lib/audio';
import type { AppState } from '@/lib/useAppState';

interface Props {
  state: AppState;
  isParent: boolean;
}

export function FamilyHubTab({ state, isParent }: Props) {
  const { messages, needsList } = state;
  const [msg, setMsg] = useState('');
  const [item, setItem] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [messages.length]);

  async function sendMessage() {
    if (!msg.trim() || busy) return;
    setBusy(true);
    const author = isParent ? 'parent' : 'aniyah';
    const { error } = await supabase.from('messages').insert({ author, body: msg.trim() });
    setBusy(false);
    if (error) return;
    playClick();
    setMsg('');
    state.refresh();
  }

  async function addNeed() {
    if (!item.trim() || busy) return;
    setBusy(true);
    const added_by = isParent ? 'parent' : 'aniyah';
    const { error } = await supabase.from('needs_list').insert({ item: item.trim(), added_by });
    setBusy(false);
    if (error) return;
    playClick();
    setItem('');
    state.refresh();
  }

  async function toggleNeed(id: string, checked: boolean) {
    if (!isParent && !checked) return; // only parent can check off? Actually both can check off per spec: "parents can cross items off"
    // Spec says parents check off. We'll allow parent only.
    if (!isParent) return;
    await supabase.from('needs_list').update({ checked: !checked }).eq('id', id);
    playClick();
    state.refresh();
  }

  async function deleteNeed(id: string) {
    if (!isParent) return;
    await supabase.from('needs_list').delete().eq('id', id);
    state.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Live alert banner is rendered at the App level across all tabs */}

      {/* Family Message Board */}
      <section className="rounded-2xl bg-cream-50 border border-charcoal-200 p-4">
        <h3 className="font-display font-bold text-charcoal-800 mb-3 flex items-center gap-2">
          <MessageSquare size={18} className="text-ginger-500" /> Family Message Board
        </h3>
        <div ref={scrollRef} className="space-y-2 max-h-72 overflow-y-auto mb-3 pr-1">
          {messages.length === 0 ? (
            <p className="text-sm text-charcoal-400 italic text-center py-4">No messages yet. Say hi!</p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`flex ${m.author === (isParent ? 'parent' : 'aniyah') ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 ${
                  m.author === 'parent'
                    ? 'bg-charcoal-700 text-white rounded-br-md'
                    : 'bg-ginger-100 text-charcoal-800 rounded-bl-md'
                }`}>
                  <div className="text-[10px] font-bold uppercase tracking-wide opacity-70 mb-0.5">
                    {m.author === 'parent' ? 'Parent' : 'Aniyah'}
                  </div>
                  <div className="text-sm">{m.body}</div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="flex gap-2">
          <input
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={isParent ? "Reply to Aniyah..." : "Write a note to your parents..."}
            className="flex-1 rounded-xl border border-charcoal-200 px-3 py-2.5 text-sm bg-cream-100"
          />
          <button onClick={sendMessage} disabled={busy || !msg.trim()} className="grid place-items-center h-11 w-11 rounded-xl bg-ginger-500 hover:bg-ginger-600 text-white disabled:opacity-50">
            <Send size={18} />
          </button>
        </div>
      </section>

      {/* Needs List */}
      <section className="rounded-2xl bg-cream-50 border border-charcoal-200 p-4">
        <h3 className="font-display font-bold text-charcoal-800 mb-3 flex items-center gap-2">
          <ShoppingCart size={18} className="text-ginger-500" /> Needs List
        </h3>
        <div className="flex gap-2 mb-3">
          <input
            value={item}
            onChange={(e) => setItem(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addNeed()}
            placeholder="Add an item (e.g. Cat Food, Milk)..."
            className="flex-1 rounded-xl border border-charcoal-200 px-3 py-2.5 text-sm bg-cream-100"
          />
          <button onClick={addNeed} disabled={busy || !item.trim()} className="px-4 rounded-xl bg-ginger-500 hover:bg-ginger-600 text-white font-bold text-sm disabled:opacity-50">
            Add
          </button>
        </div>
        {needsList.length === 0 ? (
          <p className="text-sm text-charcoal-400 italic text-center py-4">The list is empty.</p>
        ) : (
          <ul className="space-y-1.5">
            {needsList.map((n) => (
              <li key={n.id} className={`flex items-center gap-2.5 rounded-xl px-3 py-2 border ${
                n.checked ? 'bg-emerald-50 border-emerald-200' : 'bg-cream-100 border-charcoal-100'
              }`}>
                <button
                  disabled={!isParent}
                  onClick={() => toggleNeed(n.id, n.checked)}
                  className={`grid place-items-center h-7 w-7 rounded-lg border-2 shrink-0 ${
                    n.checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-cream-50 border-charcoal-300 text-transparent'
                  } ${isParent ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <Check size={16} />
                </button>
                <span className={`text-sm flex-1 ${n.checked ? 'line-through text-charcoal-400' : 'text-charcoal-700'}`}>
                  {n.item}
                </span>
                <span className="text-[10px] text-charcoal-400 uppercase font-bold">{n.added_by}</span>
                {isParent && (
                  <button onClick={() => deleteNeed(n.id)} className="text-charcoal-300 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        {!isParent && <p className="mt-2 text-xs text-charcoal-400 italic">Ask a parent to check items off at the store.</p>}
      </section>
    </div>
  );
}
