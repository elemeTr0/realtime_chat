
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "../supabase";
import hopLogo from "../assets/HOPlogo.png";
import "../../styles/Home.css";

type HomeProps = {
    onLogout: () => void;
};

type User = {
    id: string;
    username: string;
};

type Conversation = {
    id: string;
    username: string;
    created_at: string;
};

type Message = {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    created_at: string;
};

function Home({ onLogout }: HomeProps) {
    const [search, setSearch] = useState("");
    const [users, setUsers] = useState<User[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] =
        useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState("");

    const [searchError, setSearchError] = useState("");
    const [messageError, setMessageError] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [isStartingChat, setIsStartingChat] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isLoadingConversations, setIsLoadingConversations] =
        useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    async function loadConversations() {
        setIsLoadingConversations(true);

        try {
            const {
                data: { user: currentUser },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError || !currentUser) {
                throw new Error("Please log in again.");
            }

            setCurrentUserId(currentUser.id);

            const { data: memberships, error: membershipError } =
                await supabase
                    .from("conversation_members")
                    .select("conversation_id")
                    .eq("user_id", currentUser.id);

            if (membershipError) throw membershipError;

            const conversationIds = [
                ...new Set(
                    (memberships ?? []).map(
                        (membership) => membership.conversation_id,
                    ),
                ),
            ];

            if (conversationIds.length === 0) {
                setConversations([]);
                return;
            }

            const { data: conversationData, error: conversationError } =
                await supabase
                    .from("conversations")
                    .select("id, created_at")
                    .in("id", conversationIds)
                    .order("created_at", { ascending: false });

            if (conversationError) throw conversationError;

            const { data: memberData, error: memberError } =
                await supabase
                    .from("conversation_members")
                    .select("conversation_id, user_id")
                    .in("conversation_id", conversationIds)
                    .neq("user_id", currentUser.id);

            if (memberError) throw memberError;

            const otherUserIds = [
                ...new Set((memberData ?? []).map((member) => member.user_id)),
            ];

            if (otherUserIds.length === 0) {
                setConversations([]);
                return;
            }

            const { data: profiles, error: profileError } = await supabase
                .from("profiles")
                .select("id, username")
                .in("id", otherUserIds);

            if (profileError) throw profileError;

            const profileMap = new Map(
                (profiles ?? []).map((profile) => [
                    profile.id,
                    profile.username,
                ]),
            );

            const conversationList: Conversation[] = (
                conversationData ?? []
            )
                .map((conversation) => {
                    const otherMember = memberData?.find(
                        (member) =>
                            member.conversation_id === conversation.id,
                    );

                    if (!otherMember) return null;

                    const username = profileMap.get(otherMember.user_id);

                    if (!username) return null;

                    return {
                        id: conversation.id,
                        username,
                        created_at: conversation.created_at,
                    };
                })
                .filter(
                    (conversation): conversation is Conversation =>
                        conversation !== null,
                );

            setConversations(conversationList);

            setSelectedConversation((previous) => {
                if (!previous) return null;

                return (
                    conversationList.find(
                        (conversation) => conversation.id === previous.id,
                    ) ?? null
                );
            });
        } catch (error) {
            console.error("Failed to load conversations:", error);
            setSearchError("Couldn't load your conversations.");
        } finally {
            setIsLoadingConversations(false);
        }
    }

    useEffect(() => {
    async function initialize() {
        await loadConversations();
    }

    void initialize();
}, []);

const selectedConversationId = selectedConversation?.id;

useEffect(() => {
    let isActive = true;

    async function loadMessages() {
        if (!selectedConversationId) {
            setIsLoadingMessages(false);
            return;
        }

        setIsLoadingMessages(true);

        try {
            const { data, error } = await supabase
                .from("messages")
                .select(
                    "id, conversation_id, sender_id, content, created_at",
                )
                .eq("conversation_id", selectedConversationId)
                .order("created_at", { ascending: true });

            if (error) throw error;

            if (isActive) {
                setMessages(data ?? []);
                setMessageError("");
            }
        } catch (error) {
            console.error("Failed to load messages:", error);

            if (isActive) {
                setMessageError(
                    "Couldn't load messages. Please try again.",
                );
            }
        } finally {
            if (isActive) {
                setIsLoadingMessages(false);
            }
        }
    }

    void loadMessages();

    return () => {
        isActive = false;
    };
}, [selectedConversationId]);
    async function searchUsers() {
        const username = search.trim();

        setSearchError("");
        setUsers([]);
        setHasSearched(false);

        if (!username) {
            setSearchError("Enter a username to search.");
            return;
        }

        setIsSearching(true);

        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("id, username")
                .ilike("username", `%${username}%`)
                .limit(10);

            if (error) throw error;

            const {
                data: { user: currentUser },
            } = await supabase.auth.getUser();

            setUsers(
                (data ?? []).filter((user) => user.id !== currentUser?.id),
            );
            setHasSearched(true);
        } catch (error) {
            console.error("User search failed:", error);
            setSearchError("Couldn't search users. Please try again.");
        } finally {
            setIsSearching(false);
        }
    }

    async function startConversation(user: User) {
        setSearchError("");

        if (isStartingChat) return;

        setIsStartingChat(true);

        try {
            const {
                data: { user: currentUser },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError || !currentUser) {
                throw new Error("Please log in again.");
            }

            const existingConversation = conversations.find(
                (conversation) => conversation.username === user.username,
            );

            if (existingConversation) {
                setSelectedConversation(existingConversation);
                setUsers([]);
                setSearch("");
                return;
            }

            const { data: conversation, error: conversationError } =
                await supabase
                    .from("conversations")
                    .insert({ created_by: currentUser.id })
                    .select("id, created_at")
                    .single();

            if (conversationError || !conversation) {
                throw conversationError ?? new Error("Conversation failed.");
            }

            const { error: membersError } = await supabase
                .from("conversation_members")
                .insert([
                    {
                        conversation_id: conversation.id,
                        user_id: currentUser.id,
                    },
                    {
                        conversation_id: conversation.id,
                        user_id: user.id,
                    },
                ]);

            if (membersError) throw membersError;

            const newConversation: Conversation = {
                id: conversation.id,
                username: user.username,
                created_at: conversation.created_at,
            };

            setConversations((previous) => [
                newConversation,
                ...previous,
            ]);
            setSelectedConversation(newConversation);
            setUsers([]);
            setSearch("");
        } catch (error) {
            console.error("Failed to start conversation:", error);
            setSearchError(
                "Couldn't start the conversation. Please try again.",
            );
        } finally {
            setIsStartingChat(false);
        }
    }

    async function sendMessage(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const content = newMessage.trim();

        if (!content || !selectedConversation || isSending) return;

        setIsSending(true);
        setMessageError("");

        try {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError || !user) {
                throw new Error("Please log in again.");
            }

            const { data, error } = await supabase
                .from("messages")
                .insert({
                    conversation_id: selectedConversation.id,
                    sender_id: user.id,
                    content,
                })
                .select(
                    "id, conversation_id, sender_id, content, created_at",
                )
                .single();

            if (error) throw error;

            setMessages((previous) => [...previous, data]);
            setNewMessage("");
        } catch (error) {
            console.error("Failed to send message:", error);
            setMessageError(
                "Couldn't send your message. Please try again.",
            );
        } finally {
            setIsSending(false);
        }
    }

    async function handleLogout() {
        const { error } = await supabase.auth.signOut();

        if (error) {
            setSearchError("Couldn't log out. Please try again.");
            return;
        }

        onLogout();
    }

    return (
        <main className="messenger">
            <aside className="chat-sidebar">
                <header className="sidebar-header">
                    <img
                        src={hopLogo}
                        alt="HOP logo"
                        className="hop-logo"
                    />
                    <button type="button" onClick={handleLogout}>
                        Log out
                    </button>
                </header>

                <form
                    className="user-search"
                    onSubmit={(event) => {
                        event.preventDefault();
                        void searchUsers();
                    }}
                >
                    <input
                        type="search"
                        placeholder="Find people..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                    <button type="submit" disabled={isSearching}>
                        {isSearching ? "..." : "Search"}
                    </button>
                </form>

                {searchError && (
                    <p className="home-error">{searchError}</p>
                )}

                {users.length > 0 && (
                    <section className="search-results">
                        <h3>People</h3>

                        {users.map((user) => (
                            <button
                                key={user.id}
                                type="button"
                                className="person-result"
                                onClick={() => void startConversation(user)}
                                disabled={isStartingChat}
                            >
                                <span className="avatar">
                                    {user.username.charAt(0).toUpperCase()}
                                </span>
                                <span>{user.username}</span>
                            </button>
                        ))}
                    </section>
                )}

                {hasSearched && users.length === 0 && !searchError && (
                    <p className="empty-sidebar">No other users found.</p>
                )}

                <section className="conversation-section">
                    <h3>Your conversations</h3>

                    {isLoadingConversations ? (
                        <p className="empty-sidebar">Loading chats...</p>
                    ) : conversations.length === 0 ? (
                        <p className="empty-sidebar">
                            No chats yet. Search for someone to say hello!
                        </p>
                    ) : (
                        conversations.map((conversation) => (
                            <button
                                key={conversation.id}
                                type="button"
                                className={`conversation-item ${
                                    selectedConversation?.id === conversation.id
                                        ? "active"
                                        : ""
                                }`}
                                onClick={() =>
                                    setSelectedConversation(conversation)
                                }
                            >
                                <span className="avatar">
                                    {conversation.username
                                        .charAt(0)
                                        .toUpperCase()}
                                </span>

                                <span className="conversation-info">
                                    <strong>{conversation.username}</strong>
                                    <small>Open conversation</small>
                                </span>
                            </button>
                        ))
                    )}
                </section>
            </aside>

            <section className="chat-panel">
                {selectedConversation ? (
                    <>
                        <header className="chat-header">
                            <span className="avatar">
                                {selectedConversation.username
                                    .charAt(0)
                                    .toUpperCase()}
                            </span>

                            <div>
                                <h2>{selectedConversation.username}</h2>
                                <p>Your HOP conversation</p>
                            </div>
                        </header>

                        <div className="messages-area">
                            {isLoadingMessages ? (
                                <p className="messages-status">
                                    Loading messages...
                                </p>
                            ) : messageError && messages.length === 0 ? (
                                <p className="messages-status error">
                                    {messageError}
                                </p>
                            ) : messages.length === 0 ? (
                                <div className="messages-empty">
                                    <span>✦</span>
                                    <h3>Say hello!</h3>
                                    <p>
                                        This is the beginning of your
                                        conversation with{" "}
                                        {selectedConversation.username}.
                                    </p>
                                </div>
                            ) : (
                                messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`message-row ${
                                            message.sender_id === currentUserId
                                                ? "mine"
                                                : "theirs"
                                        }`}
                                    >
                                        <div className="message-bubble">
                                            <p>{message.content}</p>
                                            <time>
                                                {new Date(
                                                    message.created_at,
                                                ).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </time>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {messageError && messages.length > 0 && (
                            <p className="home-error">{messageError}</p>
                        )}

                        <form
                            className="message-form"
                            onSubmit={sendMessage}
                        >
                            <input
                                type="text"
                                placeholder="Write a message..."
                                value={newMessage}
                                onChange={(event) =>
                                    setNewMessage(event.target.value)
                                }
                                disabled={isSending}
                                aria-label="Write a message"
                            />

                            <button
                                type="submit"
                                disabled={isSending || !newMessage.trim()}
                            >
                                {isSending ? "Sending..." : "Send"}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="welcome-panel">
                        <img src={hopLogo} alt="HOP logo" />
                        <h1>Welcome to HOP!</h1>
                        <p>
                            Pick a conversation or search for someone new.
                        </p>
                    </div>
                )}
            </section>
        </main>
    );
}

export default Home;