
"use client";

import { FormEvent, useState } from "react";
import styles from "./page.module.css";

type Product = {
  product_id: string;
  product_name: string;
  cosine_distance: number;
};

type AskResponse = {
  success: boolean;
  data: {
    question: string;
    answer: string;
    products: Product[];
  };
};

type Message = {
  role: "assistant" | "user";
  text: string;
  products?: Product[];
};

const suggestions = [
  "Suggest a comfortable cotton shirt for hot summer weather",
  "Help me find a casual outfit",
  "Recommend clothes for a weekend outing",
];

export default function AILabPage() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hey! I'm VisionCart AI, your personal shopping assistant. Tell me what you're looking for, and I'll search the available product catalog.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendMessage(
    event?: FormEvent<HTMLFormElement>,
    suggestedQuery?: string,
  ) {
    event?.preventDefault();

    const question = (suggestedQuery ?? query).trim();
    if (!question || loading) return;

    setMessages((previous) => [
      ...previous,
      { role: "user", text: question },
    ]);
    setQuery("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: question, limit: 5 }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.detail ?? "The assistant could not process your request.",
        );
      }

      const payload = result as AskResponse;

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: payload.data.answer,
          products: payload.data.products,
        },
      ]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <aside className={styles.sidebar}>
        <a href="/" className={styles.brand}>
          <span className={styles.brandIcon}>V</span>
          <span>VisionCart<span className={styles.brandAI}> AI</span></span>
        </a>

        <div className={styles.labLabel}>WORKSPACE</div>
        <div className={styles.activeNav}>✦ &nbsp; AI Shopping Lab</div>

        <button
          className={styles.newChat}
          onClick={() => {
            setMessages([
              {
                role: "assistant",
                text: "New conversation started. What would you like to find today?",
              },
            ]);
            setError("");
          }}
        >
          + &nbsp; New conversation
        </button>

        <div className={styles.sidebarBottom}>
          <span className={styles.statusDot} />
          AI Lab · Development
          <p>Powered by your VisionCart API</p>
        </div>
      </aside>

      <section className={styles.workspace}>
        <header className={styles.topbar}>
          <div>
            <span className={styles.breadcrumb}>VisionCart /</span>{" "}
            <strong>AI Lab</strong>
          </div>
          <span className={styles.environment}>LOCAL DEVELOPMENT</span>
        </header>

        <div className={styles.chat}>
          <div className={styles.chatHeading}>
            <div className={styles.sparkle}>✦</div>
            <h1>Your AI shopping assistant</h1>
            <p>Explore products, test recommendations, and improve your AI.</p>
          </div>

          <div className={styles.messages}>
            {messages.map((message, index) => (
              <div
                className={`${styles.message} ${
                  message.role === "user"
                    ? styles.userMessage
                    : styles.assistantMessage
                }`}
                key={`${index}-${message.role}`}
              >
                {message.role === "assistant" && (
                  <div className={styles.avatar}>V</div>
                )}

                <div className={styles.messageContent}>
                  <div className={styles.roleName}>
                    {message.role === "user" ? "You" : "VisionCart AI"}
                  </div>
                  <div className={styles.bubble}>{message.text}</div>

                  {!!message.products?.length && (
                    <div className={styles.productSection}>
                      <h3>Retrieved products</h3>
                      {message.products.map((product) => (
                        <div
                          className={styles.productCard}
                          key={product.product_id}
                        >
                          <div className={styles.productIcon}>◇</div>
                          <div className={styles.productInfo}>
                            <strong>{product.product_name}</strong>
                            <span>ID: {product.product_id}</span>
                            <span>
                              Cosine distance:{" "}
                              {product.cosine_distance.toFixed(4)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className={styles.loading}>
                <span className={styles.statusDot} />
                Searching products and generating a response...
              </div>
            )}

            {error && <div className={styles.error}>{error}</div>}
          </div>

          <div className={styles.composerArea}>
            {messages.length <= 1 && (
              <div className={styles.suggestions}>
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => void sendMessage(undefined, suggestion)}
                    disabled={loading}
                  >
                    ✦ &nbsp; {suggestion}
                  </button>
                ))}
              </div>
            )}

            <form
              className={styles.composer}
              onSubmit={(event) => void sendMessage(event)}
            >
              <textarea
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ask about products, styles, or occasions..."
                rows={2}
                maxLength={500}
                disabled={loading}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
              />
              <div className={styles.composerFooter}>
                <span>Test with your current product catalog</span>
                <button
                  className={styles.sendButton}
                  type="submit"
                  disabled={loading || !query.trim()}
                  aria-label="Send message"
                >
                  {loading ? "…" : "↑"}
                </button>
              </div>
            </form>
            <p className={styles.disclaimer}>
              AI responses can be inaccurate. Verify product details against
              the catalog.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
