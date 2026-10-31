import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "../api/ApiError";
import { chatApi } from "../api/chat.api";
import type { ChatSummary, Message } from "../types/chat";

const POLL_MS = 1500;
const timeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export function useChat() {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [chatsError, setChatsError] = useState(false);
  const [activeId, setActiveIdState] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isStreaming, setIsStreamingState] = useState(false);

  // 1) state for pagination of older messages
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const nextBeforeRef = useRef<string | null>(null);
  const olderBusy = useRef(false);

  const activeIdRef = useRef<string | null>(null);
  const streamingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const pollRef = useRef<number | undefined>(undefined);
  const loadToken = useRef(0); // ignores late responses after switching chats

  const setActiveId = (id: string | null) => {
    activeIdRef.current = id;
    setActiveIdState(id);
  };
  const setStreaming = (v: boolean) => {
    streamingRef.current = v;
    setIsStreamingState(v);
  };
  const stopPolling = () => window.clearTimeout(pollRef.current);

  /* ── chat list ── */
  const loadChats = useCallback(async () => {
    setChatsLoading(true);
    setChatsError(false);
    try {
      setChats(await chatApi.list());
    } catch {
      setChatsError(true);
    } finally {
      setChatsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadChats();
  }, [loadChats]);

  useEffect(
    () => () => {
      abortRef.current?.abort();
      window.clearTimeout(pollRef.current);
    },
    [],
  );

  const bump = (id: string) =>
    setChats((list) => {
      const found = list.find((c) => c.id === id);
      if (!found) return list;
      return [
        { ...found, updatedAt: new Date().toISOString() },
        ...list.filter((c) => c.id !== id),
      ];
    });

  /* ── open a chat, and resume a reply that is still generating ── */
  const poll = useCallback(
    async (id: string, token: number, resumed: boolean) => {
      try {
        const cur = await chatApi.current(id);
        if (token !== loadToken.current) return;

        if (cur.isStreaming && cur.message) {
          const live = { ...cur.message, status: "streaming" as const };
          setMessages((list) =>
            list.some((m) => m.id === live.id)
              ? list.map((m) => (m.id === live.id ? live : m))
              : [...list, live],
          );
          streamingRef.current = true;
          setIsStreamingState(true);
          pollRef.current = window.setTimeout(
            () => void poll(id, token, true),
            POLL_MS,
          );
          return;
        }

        if (resumed) {
          const fresh = await chatApi.retrieve(id); // the reply finished while we were watching
          if (token !== loadToken.current) return;
          setMessages(fresh.messages);
          // 3) poll(), resumed branch
          setHasMore(fresh.hasMore);
          nextBeforeRef.current = fresh.nextBefore;
        }
        // a row stuck on "streaming" with no live generation means the server stopped mid-reply
        setMessages((list) =>
          list.map((m) =>
            m.status === "streaming" ? { ...m, status: "stopped" as const } : m,
          ),
        );
        streamingRef.current = false;
        setIsStreamingState(false);
      } catch {
        if (token === loadToken.current) {
          streamingRef.current = false;
          setIsStreamingState(false);
        }
      }
    },
    [],
  );

  const openChat = useCallback(
    async (id: string | null) => {
      abortRef.current?.abort();
      abortRef.current = null;
      stopPolling();
      setStreaming(false);
      const token = ++loadToken.current;
      setActiveId(id);
      setLoadError(null);
      setMessages([]);
      // 2) openChat setup reset
      setHasMore(false);
      nextBeforeRef.current = null;

      if (!id) {
        setMessagesLoading(false);
        return;
      }
      setMessagesLoading(true);
      try {
        const r = await chatApi.retrieve(id);
        if (token !== loadToken.current) return;
        setMessages(r.messages);
        setHasMore(r.hasMore);
        nextBeforeRef.current = r.nextBefore;
        setMessagesLoading(false);
        void poll(id, token, false);
      } catch (e) {
        if (token !== loadToken.current) return;
        setMessagesLoading(false);
        setLoadError(
          e instanceof ApiError ? e.message : "Could not load this chat.",
        );
      }
    },
    [poll],
  );

  /* ── send a message (creates the chat first when needed) ── */
  const send = useCallback(
    async (text: string, files: { id: string; name: string }[] = []) => {
      if (streamingRef.current) return;

      const userContent = files.length
        ? `${files.map((f) => `[Attached: ${f.name}]`).join(" ")}\n${text}`
        : text;

      const now = new Date().toISOString();
      const aiId = crypto.randomUUID();
      setMessages((list) => [
        ...list,
        {
          id: crypto.randomUUID(),
          role: "user",
          content: userContent,
          status: "complete",
          toolCalls: [],
          createdAt: now,
        },
        {
          id: aiId,
          role: "assistant",
          content: "",
          status: "streaming",
          toolCalls: [],
          createdAt: now,
        },
      ]);
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      let chatId = activeIdRef.current;
      let ended = false;
      const patch = (fn: (m: Message) => Message) =>
        setMessages((list) => list.map((m) => (m.id === aiId ? fn(m) : m)));

      const finish = (
        status: "complete" | "stopped" | "error",
        errorMessage?: string,
      ) => {
        if (ended) return;
        ended = true;
        patch((m) => ({
          ...m,
          status,
          errorMessage,
          toolCalls: m.toolCalls.map((t) =>
            t.status === "running" ? { ...t, status: "error" as const } : t,
          ),
        }));
        if (chatId) bump(chatId);
      };

      try {
        if (!chatId) {
          const created = await chatApi.create();
          chatId = created.id;
          setActiveId(created.id);
          setChats((list) => [created, ...list]);
        }
        const id = chatId;

        await chatApi.stream(
          id,
          {
            message: text,
            timezone: timeZone(),
            attachment_ids: files.map((f) => f.id),
          },
          {
            onStart: (d) =>
              setChats((list) =>
                list.map((c) =>
                  c.id === id ? { ...c, title: d.chat_title } : c,
                ),
              ),
            onToken: (d) =>
              patch((m) => ({ ...m, content: m.content + d.delta })),
            onToolStart: (d) =>
              patch((m) => ({
                ...m,
                toolCalls: [
                  ...m.toolCalls,
                  { id: d.id, name: d.name, status: "running" },
                ],
              })),
            onToolEnd: (d) =>
              patch((m) => ({
                ...m,
                toolCalls: m.toolCalls.map((t) =>
                  t.id === d.id ? { ...t, status: d.ok ? "done" : "error" } : t,
                ),
              })),
            onDone: () => finish("complete"),
            onError: (d) => finish("error", d.message),
          },
          controller.signal,
        );
        if (!ended)
          finish(
            "error",
            "The connection was lost before the reply finished.",
          );
      } catch (e) {
        if (controller.signal.aborted) finish("stopped");
        else
          finish(
            "error",
            e instanceof ApiError
              ? e.message
              : "Something went wrong. Try again.",
          );
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        setStreaming(false);
      }
    },
    [],
  );

  /** Stops our own stream (the server saves the partial reply). When only watching a resumed reply, stops watching. */
  const stop = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    else {
      stopPolling();
      setStreaming(false);
    }
  }, []);

  const deleteChat = useCallback(
    async (id: string) => {
      await chatApi.remove(id);
      setChats((list) => list.filter((c) => c.id !== id));
      if (activeIdRef.current === id) await openChat(null);
    },
    [openChat],
  );

  // 4) new loadOlder callback
  const loadOlder = useCallback(async () => {
    const id = activeIdRef.current;
    const before = nextBeforeRef.current;
    if (!id || !before || olderBusy.current) return;
    olderBusy.current = true;
    setLoadingOlder(true);
    try {
      const r = await chatApi.retrieve(id, before);
      if (activeIdRef.current !== id) return;
      setMessages((list) => {
        const have = new Set(list.map((m) => m.id));
        return [...r.messages.filter((m) => !have.has(m.id)), ...list];
      });
      setHasMore(r.hasMore);
      nextBeforeRef.current = r.nextBefore;
    } catch {
      /* the button stays, so the user can try again */
    } finally {
      olderBusy.current = false;
      setLoadingOlder(false);
    }
  }, []);

  const renameChat = useCallback(
    async (id: string, title: string) => {
      const t = title.trim();
      if (!t) return;
      setChats((l) => l.map((c) => (c.id === id ? { ...c, title: t } : c)));
      try {
        await chatApi.update(id, { title: t });
      } catch {
        void loadChats(); // restore the real title
      }
    },
    [loadChats],
  );

  const togglePin = useCallback(
    async (id: string) => {
      const cur = chats.find((c) => c.id === id);
      if (!cur) return;
      const next = !cur.pinned;
      setChats((l) => l.map((c) => (c.id === id ? { ...c, pinned: next } : c)));
      try {
        await chatApi.update(id, { pinned: next });
      } catch {
        setChats((l) =>
          l.map((c) => (c.id === id ? { ...c, pinned: !next } : c)),
        );
      }
    },
    [chats],
  );

  /** Sends the user message before this reply again. It adds a new exchange, it does not replace the old one. */
  const retry = useCallback(
    (aiMessageId: string) => {
      if (streamingRef.current) return;
      const at = messages.findIndex((m) => m.id === aiMessageId);
      for (let j = at - 1; j >= 0; j--) {
        if (messages[j].role === "user") return void send(messages[j].content);
      }
    },
    [messages, send],
  );

  return {
    chats,
    chatsLoading,
    chatsError,
    reloadChats: loadChats,
    activeId,
    messages,
    messagesLoading,
    hasMore,
    loadingOlder,
    loadOlder,
    loadError,
    isStreaming,
    openChat,
    send,
    stop,
    deleteChat,
    renameChat,
    togglePin,
    retry,
  };
}

// import { useCallback, useEffect, useRef, useState } from "react";
// import { ApiError } from "../api/ApiError";
// import { chatApi } from "../api/chat.api";
// import type { ChatSummary, Message } from "../types/chat";
//
// const POLL_MS = 1500;
// const timeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
//
// export function useChat() {
//   const [chats, setChats] = useState<ChatSummary[]>([]);
//   const [chatsLoading, setChatsLoading] = useState(true);
//   const [chatsError, setChatsError] = useState(false);
//   const [activeId, setActiveIdState] = useState<string | null>(null);
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [messagesLoading, setMessagesLoading] = useState(false);
//   const [loadError, setLoadError] = useState<string | null>(null);
//   const [isStreaming, setIsStreamingState] = useState(false);
//
//   const activeIdRef = useRef<string | null>(null);
//   const streamingRef = useRef(false);
//   const abortRef = useRef<AbortController | null>(null);
//   const pollRef = useRef<number | undefined>(undefined);
//   const loadToken = useRef(0); // ignores late responses after switching chats
//
//   const setActiveId = (id: string | null) => {
//     activeIdRef.current = id;
//     setActiveIdState(id);
//   };
//   const setStreaming = (v: boolean) => {
//     streamingRef.current = v;
//     setIsStreamingState(v);
//   };
//   const stopPolling = () => window.clearTimeout(pollRef.current);
//
//   /* ── chat list ── */
//   const loadChats = useCallback(async () => {
//     setChatsLoading(true);
//     setChatsError(false);
//     try {
//       setChats(await chatApi.list());
//     } catch {
//       setChatsError(true);
//     } finally {
//       setChatsLoading(false);
//     }
//   }, []);
//
//   useEffect(() => {
//     void loadChats();
//   }, [loadChats]);
//
//   useEffect(
//     () => () => {
//       abortRef.current?.abort();
//       window.clearTimeout(pollRef.current);
//     },
//     [],
//   );
//
//   const bump = (id: string) =>
//     setChats((list) => {
//       const found = list.find((c) => c.id === id);
//       if (!found) return list;
//       return [
//         { ...found, updatedAt: new Date().toISOString() },
//         ...list.filter((c) => c.id !== id),
//       ];
//     });
//
//   /* ── open a chat, and resume a reply that is still generating ── */
//   const poll = useCallback(
//     async (id: string, token: number, resumed: boolean) => {
//       try {
//         const cur = await chatApi.current(id);
//         if (token !== loadToken.current) return;
//
//         if (cur.isStreaming && cur.message) {
//           const live = { ...cur.message, status: "streaming" as const };
//           setMessages((list) =>
//             list.some((m) => m.id === live.id)
//               ? list.map((m) => (m.id === live.id ? live : m))
//               : [...list, live],
//           );
//           streamingRef.current = true;
//           setIsStreamingState(true);
//           pollRef.current = window.setTimeout(
//             () => void poll(id, token, true),
//             POLL_MS,
//           );
//           return;
//         }
//
//         if (resumed) {
//           const fresh = await chatApi.retrieve(id); // the reply finished while we were watching
//           if (token !== loadToken.current) return;
//           setMessages(fresh.messages);
//         }
//         // a row stuck on "streaming" with no live generation means the server stopped mid-reply
//         setMessages((list) =>
//           list.map((m) =>
//             m.status === "streaming" ? { ...m, status: "stopped" as const } : m,
//           ),
//         );
//         streamingRef.current = false;
//         setIsStreamingState(false);
//       } catch {
//         if (token === loadToken.current) {
//           streamingRef.current = false;
//           setIsStreamingState(false);
//         }
//       }
//     },
//     [],
//   );
//
//   const openChat = useCallback(
//     async (id: string | null) => {
//       abortRef.current?.abort();
//       abortRef.current = null;
//       stopPolling();
//       setStreaming(false);
//       const token = ++loadToken.current;
//       setActiveId(id);
//       setLoadError(null);
//       setMessages([]);
//
//       if (!id) {
//         setMessagesLoading(false);
//         return;
//       }
//       setMessagesLoading(true);
//       try {
//         const { messages: rows } = await chatApi.retrieve(id);
//         if (token !== loadToken.current) return;
//         setMessages(rows);
//         setMessagesLoading(false);
//         void poll(id, token, false);
//       } catch (e) {
//         if (token !== loadToken.current) return;
//         setMessagesLoading(false);
//         setLoadError(
//           e instanceof ApiError ? e.message : "Could not load this chat.",
//         );
//       }
//     },
//     [poll],
//   );
//
//   /* ── send a message (creates the chat first when needed) ── */
//   const send = useCallback(async (text: string) => {
//     if (streamingRef.current) return;
//
//     const now = new Date().toISOString();
//     const aiId = crypto.randomUUID();
//     setMessages((list) => [
//       ...list,
//       {
//         id: crypto.randomUUID(),
//         role: "user",
//         content: text,
//         status: "complete",
//         toolCalls: [],
//         createdAt: now,
//       },
//       {
//         id: aiId,
//         role: "assistant",
//         content: "",
//         status: "streaming",
//         toolCalls: [],
//         createdAt: now,
//       },
//     ]);
//     setStreaming(true);
//
//     const controller = new AbortController();
//     abortRef.current = controller;
//
//     let chatId = activeIdRef.current;
//     let ended = false;
//     const patch = (fn: (m: Message) => Message) =>
//       setMessages((list) => list.map((m) => (m.id === aiId ? fn(m) : m)));
//
//     const finish = (
//       status: "complete" | "stopped" | "error",
//       errorMessage?: string,
//     ) => {
//       if (ended) return;
//       ended = true;
//       patch((m) => ({
//         ...m,
//         status,
//         errorMessage,
//         toolCalls: m.toolCalls.map((t) =>
//           t.status === "running" ? { ...t, status: "error" as const } : t,
//         ),
//       }));
//       if (chatId) bump(chatId);
//     };
//
//     try {
//       if (!chatId) {
//         const created = await chatApi.create();
//         chatId = created.id;
//         setActiveId(created.id);
//         setChats((list) => [created, ...list]);
//       }
//       const id = chatId;
//
//       await chatApi.stream(
//         id,
//         { message: text, timezone: timeZone() },
//         {
//           onStart: (d) =>
//             setChats((list) =>
//               list.map((c) =>
//                 c.id === id ? { ...c, title: d.chat_title } : c,
//               ),
//             ),
//           onToken: (d) =>
//             patch((m) => ({ ...m, content: m.content + d.delta })),
//           onToolStart: (d) =>
//             patch((m) => ({
//               ...m,
//               toolCalls: [
//                 ...m.toolCalls,
//                 { id: d.id, name: d.name, status: "running" },
//               ],
//             })),
//           onToolEnd: (d) =>
//             patch((m) => ({
//               ...m,
//               toolCalls: m.toolCalls.map((t) =>
//                 t.id === d.id ? { ...t, status: d.ok ? "done" : "error" } : t,
//               ),
//             })),
//           onDone: () => finish("complete"),
//           onError: (d) => finish("error", d.message),
//         },
//         controller.signal,
//       );
//       if (!ended)
//         finish("error", "The connection was lost before the reply finished.");
//     } catch (e) {
//       if (controller.signal.aborted) finish("stopped");
//       else
//         finish(
//           "error",
//           e instanceof ApiError
//             ? e.message
//             : "Something went wrong. Try again.",
//         );
//     } finally {
//       if (abortRef.current === controller) abortRef.current = null;
//       setStreaming(false);
//     }
//   }, []);
//
//   /** Stops our own stream (the server saves the partial reply). When only watching a resumed reply, stops watching. */
//   const stop = useCallback(() => {
//     if (abortRef.current) abortRef.current.abort();
//     else {
//       stopPolling();
//       setStreaming(false);
//     }
//   }, []);
//
//   const deleteChat = useCallback(
//     async (id: string) => {
//       await chatApi.remove(id);
//       setChats((list) => list.filter((c) => c.id !== id));
//       if (activeIdRef.current === id) await openChat(null);
//     },
//     [openChat],
//   );
//
//   const renameChat = useCallback(
//     async (id: string, title: string) => {
//       const t = title.trim();
//       if (!t) return;
//       setChats((l) => l.map((c) => (c.id === id ? { ...c, title: t } : c)));
//       try {
//         await chatApi.update(id, { title: t });
//       } catch {
//         void loadChats(); // restore the real title
//       }
//     },
//     [loadChats],
//   );
//
//   const togglePin = useCallback(
//     async (id: string) => {
//       const cur = chats.find((c) => c.id === id);
//       if (!cur) return;
//       const next = !cur.pinned;
//       setChats((l) => l.map((c) => (c.id === id ? { ...c, pinned: next } : c)));
//       try {
//         await chatApi.update(id, { pinned: next });
//       } catch {
//         setChats((l) =>
//           l.map((c) => (c.id === id ? { ...c, pinned: !next } : c)),
//         );
//       }
//     },
//     [chats],
//   );
//
//   /** Sends the user message before this reply again. It adds a new exchange, it does not replace the old one. */
//   const retry = useCallback(
//     (aiMessageId: string) => {
//       if (streamingRef.current) return;
//       const at = messages.findIndex((m) => m.id === aiMessageId);
//       for (let j = at - 1; j >= 0; j--) {
//         if (messages[j].role === "user") return void send(messages[j].content);
//       }
//     },
//     [messages, send],
//   );
//
//   return {
//     chats,
//     chatsLoading,
//     chatsError,
//     reloadChats: loadChats,
//     activeId,
//     messages,
//     messagesLoading,
//     loadError,
//     isStreaming,
//     openChat,
//     send,
//     stop,
//     deleteChat,
//     renameChat,
//     togglePin,
//     retry,
//   };
// }
