// frontend/src/components/Chat.tsx
import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { useChatStore, ChatMessage } from "@/stores/useChatStore";
import "@/index.css";

function IconBtn({ title, path, onClick }: { title: string; path: string; onClick: () => void }) {
  return (
    <button className="icon-btn" title={title} onClick={onClick} aria-label={title}>
      <svg viewBox="0 0 24 24" width="16" height="16">
        <path d={path} fill="currentColor" />
      </svg>
    </button>
  );
}

function Message({
  i,
  all,
  msg,
  onCopy,
  onRegen,
  onEdit,
}: {
  i: number;
  all: ChatMessage[];
  msg: ChatMessage;
  onCopy: (id: string) => void;
  onRegen: (userId: string) => void;
  onEdit: (id: string, text: string) => void;
}) {
  const isUser = msg.role === "user";
  const prevIsUser = i > 0 && all[i - 1]?.role === "user";
  return (
    <div className={`msg ${isUser ? "me" : msg.role}`} dir="rtl">
      <div className="bubble">
        <div className="content">
          <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeSanitize]}>{msg.text}</ReactMarkdown>
        </div>
        <div className="msg-actions">
          <IconBtn
            title="کپی"
            onClick={() => onCopy(msg.id)}
            path="M16 1H4c-1.1 0-2 .9-2 2v12h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
          />
          {!isUser && prevIsUser && (
            <IconBtn
              title="بازتولید پاسخ"
              onClick={() => onRegen(all[i - 1].id)}
              path="M12 6V3L8 7l4 4V8c2.76 0 5 2.24 5 5a5 5 0 01-8.54 3.54l-1.42 1.42A7 7 0 0019 13c0-3.87-3.13-7-7-7z"
            />
          )}
          {isUser && (
            <IconBtn
              title="ویرایش و ارسال"
              onClick={() => onEdit(msg.id, msg.text)}
              path="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 000-1.42l-2.34-2.34a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function Chat() {
  const { messages, sending, send, copy, regen, editAndResend, stop, theme, setTheme, reset } =
    useChatStore();
  const [text, setText] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute("dir", "rtl");
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const canSend = text.trim().length > 0 && !sending;

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const v = text.trim();
    if (!v) return;
    setText("");
    if (editId) {
      const id = editId;
      setEditId(null);
      await editAndResend(id, v);
    } else {
      await send(v);
    }
  };

  return (
    <div className="page" dir="rtl">
      <header className="topbar">
        <div className="brand">Cando Assistant 🤖</div>
        <div className="spacer" />
        <button className="pill" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? "حالت روشن 🌞" : "حالت تیره 🌙"}
        </button>
      </header>

      <main className="chat-wrap">
        <div className="chat-list" ref={listRef}>
          {messages.length === 0 && (
            <div className="empty">
              <div className="title">سلام! 👋</div>
              <div className="sub">سؤال شما…</div>
              <div className="chips">
                {[
                  "دوره لینوکس چی داره؟",
                  "مسیر یادگیری DevOps از کجاست؟",
                  "مدرس CCNA کیه؟",
                  "ثبت‌نام دوره‌ها چطور انجام می‌شه؟",
                ].map((c) => (
                  <button key={c} className="chip" onClick={() => setText(c)}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <Message
              key={m.id}
              i={i}
              all={messages}
              msg={m}
              onCopy={(id) => copy(id)}
              onRegen={(userId) => regen(userId)}
              onEdit={(id, t) => {
                setEditId(id);
                setText(t);
              }}
            />
          ))}

          {sending && (
            <div className="msg assistant">
              <div className="bubble">
                <div className="dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
        </div>

        <form className="composer" onSubmit={submit}>
          <button
            type="button"
            className="ghost"
            onClick={() => {
              if (confirm("چت پاک شود؟")) reset();
            }}
          >
            پاکسازی چت
          </button>

          <input
            dir="rtl"
            className="input"
            placeholder="سؤال شما…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          {!sending ? (
            <button className="btn" disabled={!canSend}>
              {editId ? "ویرایش و ارسال" : "ارسال"}
            </button>
          ) : (
            <button
              type="button"
              className="btn"
              style={{ background: "#c92d2d" }}
              onClick={() => stop()}
            >
              ⏹️ توقف تولید
            </button>
          )}
        </form>
      </main>

      <footer className="foot">
        ساخته و طراحی‌شده با ❤️ توسط{" "}
        <a href="mailto:amirhosseinyavari61@gmail.com">امیرحسین یاوری</a> برای{" "}
        <a href="https://cando.ac" target="_blank" rel="noreferrer">
          آکادمی کندو
        </a>
      </footer>
    </div>
  );
}
