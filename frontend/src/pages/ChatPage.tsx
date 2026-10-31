import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LuCircleAlert } from "react-icons/lu";
import { filesApi, type Attachment } from "../api/files.api";
import ChatHeader from "../components/chat/ChatHeader";
import Composer from "../components/chat/Composer";
import DeleteChatDialog from "../components/chat/DeleteChatDialog";
import EmptyState from "../components/chat/EmptyState";
import MessageList from "../components/chat/MessageList";
import StateView from "../components/common/StateView";
import ConnectAccountDialog from "../components/settings/ConnectAccountDialog";
import SettingsPanel from "../components/settings/SettingsPanel";
import Sidebar from "../components/sidebar/Sidebar";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";
import { DEFAULT_METHOD_ID } from "../constants/methods";
import { useAuth } from "../hooks/useAuth";
import { useChat } from "../hooks/useChat";
import { useDisclosure } from "../hooks/useDisclosure";
import { useSidebar } from "../hooks/useSidebar";
import AppLayout from "../layouts/AppLayout";
import { paths } from "../router/paths";
import type { ChatSummary } from "../types/chat";
import type { QuickAction } from "../types/ui";

export default function ChatPage() {
  const {
    user,
    accounts,
    logout,
    saveGeminiKey,
    chooseMethod,
    connectAccount,
    disconnectAccount,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const sidebar = useSidebar();
  const settings = useDisclosure();
  const connectDialog = useDisclosure();
  const chat = useChat();

  const [draft, setDraft] = useState("");
  const [focusToken, setFocusToken] = useState(0);
  const [methodId, setMethodId] = useState(
    user?.learningMethodId ?? DEFAULT_METHOD_ID,
  );
  const [pendingDelete, setPendingDelete] = useState<ChatSummary | null>(null);

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [attachError, setAttachError] = useState<string | null>(null);

  const closeDelete = useCallback(() => setPendingDelete(null), []);

  const attach = async (file: File) => {
    setAttachError(null);
    setUploading(true);
    try {
      const a = await filesApi.upload(file);
      setAttachments((l) => [...l, a]);
    } catch (e) {
      setAttachError(
        e instanceof Error ? e.message : "Could not attach the file.",
      );
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((l) => l.filter((a) => a.id !== id));
    void filesApi.remove(id).catch(() => {});
  };

  const closeOnMobile = () => {
    if (!sidebar.isDesktop) sidebar.close();
  };

  const prefill = (text: string) => {
    setDraft(text);
    setFocusToken((t) => t + 1);
  };

  // arriving from another page (Plan with Lumi, Connect in Settings, after Google connect)
  useEffect(() => {
    const state = location.state as {
      prompt?: string;
      openSettings?: boolean;
    } | null;
    if (!state) return;
    if (state.prompt) prefill(state.prompt);
    if (state.openSettings) settings.show();
    navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectChat = (id: string | null) => {
    void chat.openChat(id);
    setDraft("");
    setAttachments([]);
    setAttachError(null);
    closeOnMobile();
  };

  const handleQuickAction = (action: QuickAction) => {
    prefill(action.prompt);
    closeOnMobile();
  };

  const handleSend = () => {
    const text = draft.trim();
    if (!text || chat.isStreaming) return;
    setDraft("");
    const files = attachments.map((a) => ({ id: a.id, name: a.name }));
    setAttachments([]);
    void chat.send(text, files);
  };

  const changeMethod = async (id: number) => {
    const previous = methodId;
    setMethodId(id);
    try {
      await chooseMethod(id);
    } catch {
      setMethodId(previous);
    }
  };

  const handleLogout = () => {
    settings.hide();
    logout(); // RequireAuth sends the user to /login
  };

  if (!user) return null; // only while logging out; the guard is redirecting

  return (
    <AppLayout
      sidebar={
        <Sidebar
          open={sidebar.open}
          isDesktop={sidebar.isDesktop}
          user={user}
          chats={chat.chats}
          chatsLoading={chat.chatsLoading}
          chatsError={chat.chatsError}
          activeChatId={chat.activeId}
          onToggle={sidebar.toggle}
          onClose={sidebar.close}
          onNewChat={() => selectChat(null)}
          onSelectChat={selectChat}
          onRetryChats={chat.reloadChats}
          onDeleteChat={setPendingDelete}
          onQuickAction={handleQuickAction}
          onNavigate={(path) => navigate(path)}
          onOpenSettings={settings.show}
          onRenameChat={chat.renameChat}
          onPinChat={chat.togglePin}
        />
      }
      overlay={
        <>
          <SettingsPanel
            open={settings.open}
            user={user}
            accounts={accounts}
            hasGeminiKey={user.hasGeminiKey}
            onClose={settings.hide}
            onConnect={connectDialog.show}
            onDisconnect={disconnectAccount}
            onSaveGeminiKey={saveGeminiKey}
            onOpenProfile={() => {
              settings.hide();
              navigate(paths.profile);
            }}
            onLogout={handleLogout}
          />
          <ConnectAccountDialog
            open={connectDialog.open}
            onClose={connectDialog.hide}
            onContinue={connectAccount}
          />
          <DeleteChatDialog
            chat={pendingDelete}
            onClose={closeDelete}
            onConfirm={async (c) => {
              await chat.deleteChat(c.id);
              setPendingDelete(null);
            }}
          />
        </>
      }
    >
      <ChatHeader
        showMenu={!sidebar.isDesktop}
        methodId={methodId}
        onMenu={sidebar.toggle}
        onMethodChange={changeMethod}
      />

      {chat.messagesLoading ? (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <Spinner />
        </div>
      ) : chat.loadError ? (
        <div className="flex min-h-0 flex-1 items-center justify-center px-4">
          <StateView
            icon={LuCircleAlert}
            title="Could not load this chat"
            description={chat.loadError}
            action={
              <Button
                variant="primary"
                onClick={() => void chat.openChat(chat.activeId)}
              >
                Try again
              </Button>
            }
          />
        </div>
      ) : chat.messages.length === 0 ? (
        <EmptyState userName={user.fullName.split(" ")[0]} onPick={prefill} />
      ) : (
        <MessageList
          key={chat.activeId ?? "new"}
          messages={chat.messages}
          onRetry={chat.retry}
        />
      )}

      <Composer
        value={draft}
        isStreaming={chat.isStreaming}
        focusToken={focusToken}
        attachments={attachments}
        uploading={uploading}
        attachError={attachError}
        onChange={setDraft}
        onSend={handleSend}
        onStop={chat.stop}
        onAttach={(f) => void attach(f)}
        onRemoveAttachment={removeAttachment}
      />
    </AppLayout>
  );
}

// import { useCallback, useEffect, useState } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import { LuCircleAlert } from "react-icons/lu";
// import ChatHeader from "../components/chat/ChatHeader";
// import Composer from "../components/chat/Composer";
// import DeleteChatDialog from "../components/chat/DeleteChatDialog";
// import EmptyState from "../components/chat/EmptyState";
// import MessageList from "../components/chat/MessageList";
// import StateView from "../components/common/StateView";
// import ConnectAccountDialog from "../components/settings/ConnectAccountDialog";
// import SettingsPanel from "../components/settings/SettingsPanel";
// import Sidebar from "../components/sidebar/Sidebar";
// import Button from "../components/ui/Button";
// import Spinner from "../components/ui/Spinner";
// import { DEFAULT_METHOD_ID } from "../constants/methods";
// import { useAuth } from "../hooks/useAuth";
// import { useChat } from "../hooks/useChat";
// import { useDisclosure } from "../hooks/useDisclosure";
// import { useSidebar } from "../hooks/useSidebar";
// import AppLayout from "../layouts/AppLayout";
// import { paths } from "../router/paths";
// import type { ChatSummary } from "../types/chat";
// import type { QuickAction } from "../types/ui";
//
// export default function ChatPage() {
//   const {
//     user,
//     accounts,
//     logout,
//     saveGeminiKey,
//     chooseMethod,
//     connectAccount,
//     disconnectAccount,
//   } = useAuth();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const sidebar = useSidebar();
//   const settings = useDisclosure();
//   const connectDialog = useDisclosure();
//   const chat = useChat();
//
//   const [draft, setDraft] = useState("");
//   const [focusToken, setFocusToken] = useState(0);
//   const [methodId, setMethodId] = useState(
//     user?.learningMethodId ?? DEFAULT_METHOD_ID,
//   );
//   const [pendingDelete, setPendingDelete] = useState<ChatSummary | null>(null);
//   const closeDelete = useCallback(() => setPendingDelete(null), []);
//
//   const closeOnMobile = () => {
//     if (!sidebar.isDesktop) sidebar.close();
//   };
//
//   const prefill = (text: string) => {
//     setDraft(text);
//     setFocusToken((t) => t + 1);
//   };
//
//   // arriving from another page (Plan with Lumi, Connect in Settings, after Google connect)
//   useEffect(() => {
//     const state = location.state as {
//       prompt?: string;
//       openSettings?: boolean;
//     } | null;
//     if (!state) return;
//     if (state.prompt) prefill(state.prompt);
//     if (state.openSettings) settings.show();
//     navigate(location.pathname, { replace: true, state: null });
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);
//
//   const selectChat = (id: string | null) => {
//     void chat.openChat(id);
//     setDraft("");
//     closeOnMobile();
//   };
//
//   const handleQuickAction = (action: QuickAction) => {
//     prefill(action.prompt);
//     closeOnMobile();
//   };
//
//   const handleSend = () => {
//     const text = draft.trim();
//     if (!text || chat.isStreaming) return;
//     setDraft("");
//     void chat.send(text);
//   };
//
//   const changeMethod = async (id: number) => {
//     const previous = methodId;
//     setMethodId(id);
//     try {
//       await chooseMethod(id);
//     } catch {
//       setMethodId(previous);
//     }
//   };
//
//   const handleLogout = () => {
//     settings.hide();
//     logout(); // RequireAuth sends the user to /login
//   };
//
//   if (!user) return null; // only while logging out; the guard is redirecting
//
//   return (
//     <AppLayout
//       sidebar={
//         <Sidebar
//           open={sidebar.open}
//           isDesktop={sidebar.isDesktop}
//           user={user}
//           chats={chat.chats}
//           chatsLoading={chat.chatsLoading}
//           chatsError={chat.chatsError}
//           activeChatId={chat.activeId}
//           onToggle={sidebar.toggle}
//           onClose={sidebar.close}
//           onNewChat={() => selectChat(null)}
//           onSelectChat={selectChat}
//           onRetryChats={chat.reloadChats}
//           onDeleteChat={setPendingDelete}
//           onQuickAction={handleQuickAction}
//           onNavigate={(path) => navigate(path)}
//           onOpenSettings={settings.show}
//           onRenameChat={chat.renameChat}
//           onPinChat={chat.togglePin}
//         />
//       }
//       overlay={
//         <>
//           <SettingsPanel
//             open={settings.open}
//             user={user}
//             accounts={accounts}
//             hasGeminiKey={user.hasGeminiKey}
//             onClose={settings.hide}
//             onConnect={connectDialog.show}
//             onDisconnect={disconnectAccount}
//             onSaveGeminiKey={saveGeminiKey}
//             onOpenProfile={() => {
//               settings.hide();
//               navigate(paths.profile);
//             }}
//             onLogout={handleLogout}
//           />
//           <ConnectAccountDialog
//             open={connectDialog.open}
//             onClose={connectDialog.hide}
//             onContinue={connectAccount}
//           />
//           <DeleteChatDialog
//             chat={pendingDelete}
//             onClose={closeDelete}
//             onConfirm={async (c) => {
//               await chat.deleteChat(c.id);
//               setPendingDelete(null);
//             }}
//           />
//         </>
//       }
//     >
//       <ChatHeader
//         showMenu={!sidebar.isDesktop}
//         methodId={methodId}
//         onMenu={sidebar.toggle}
//         onMethodChange={changeMethod}
//       />
//
//       {chat.messagesLoading ? (
//         <div className="flex min-h-0 flex-1 items-center justify-center">
//           <Spinner />
//         </div>
//       ) : chat.loadError ? (
//         <div className="flex min-h-0 flex-1 items-center justify-center px-4">
//           <StateView
//             icon={LuCircleAlert}
//             title="Could not load this chat"
//             description={chat.loadError}
//             action={
//               <Button
//                 variant="primary"
//                 onClick={() => void chat.openChat(chat.activeId)}
//               >
//                 Try again
//               </Button>
//             }
//           />
//         </div>
//       ) : chat.messages.length === 0 ? (
//         <EmptyState userName={user.fullName.split(" ")[0]} onPick={prefill} />
//       ) : (
//         <MessageList
//           key={chat.activeId ?? "new"}
//           messages={chat.messages}
//           onRetry={chat.retry}
//         />
//       )}
//
//       <Composer
//         value={draft}
//         isStreaming={chat.isStreaming}
//         focusToken={focusToken}
//         onChange={setDraft}
//         onSend={handleSend}
//         onStop={chat.stop}
//       />
//     </AppLayout>
//   );
// }
