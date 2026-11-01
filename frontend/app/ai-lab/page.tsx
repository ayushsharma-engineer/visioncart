
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type Product = {
  product_id: string;
  product_name: string;
  image_url?: string | null;
  category?: string | null;
  colour?: string | null;
  description?: string | null;
  cosine_distance?: number;
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
  const [language, setLanguage] = useState("auto");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hey! I'm VisionCart AI, your personal shopping stylist. Tell me what you're looking for, and I'll find matching products from our catalog.",
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
        body: JSON.stringify({
          query: question,
          limit: 5,
          language,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.detail ?? "The assistant could not process your request.",
        );
      }

      const payload = result.data ?? result;
      const answer =
        typeof payload.answer === "string"
          ? payload.answer
          : "I couldn't generate a response. Please try again.";

      const products: Product[] = Array.isArray(payload.products)
        ? payload.products
        : [];

      setMessages((previous) => [
        ...previous,
        { role: "assistant", text: answer, products },
      ]);
    
    } catch (err) {
      console.error("VisionCart chat request failed:", err);
            setError(
              "We're having trouble finding products right now. Please try again in a moment."
            );
    } finally {
    setLoading(false);
}

  }

  function startNewChat() {
    setMessages([
      {
        role: "assistant",
        text:
          language === "hi"
            ? "नमस्ते! आज आप किस तरह के कपड़े या आउटफिट ढूँढ रहे हैं?"
            : "Hey! I'm VisionCart AI, your personal shopping stylist. What would you like to find today?",
      },
    ]);
    setQuery("");
    setError("");
  }

  return (
    <main className={styles.page}>
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandIcon}>V</span>
          <span>
            VisionCart<span className={styles.brandAI}> AI</span>
          </span>
        </Link>

        <div className={styles.labLabel}>WORKSPACE</div>
        <div className={styles.activeNav}>✦ &nbsp; AI Shopping Lab</div>

        <button className={styles.newChat} onClick={startNewChat}>
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

          <div className={styles.headerActions}>
            <label htmlFor="chat-language" className={styles.languageLabel}>
              Language
            </label>
            <select
              id="chat-language"
              className={styles.languageSelect}
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
            >
              <option value="auto">Auto detect</option>
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
            </select>
            <span className={styles.environment}>LOCAL DEVELOPMENT</span>
          </div>
        </header>

        <div className={styles.chat}>
          <div className={styles.chatHeading}>
            <div className={styles.sparkle}>✦</div>
            <h1>Your AI shopping assistant</h1>
            <p>
              Discover outfits and find matching products from your catalog.
            </p>
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
                      <h3>Recommended for you</h3>

                      <div className={styles.productGrid}>
                        {message.products.map((product) => (
                          <article
                            className={styles.productCard}
                            key={product.product_id}
                          >
                            {product.image_url ? (
                              <img
                                className={styles.productImage}
                                src={product.image_url}
                                alt={product.product_name}
                                loading="lazy"
                                onError={(event) => {
                                  event.currentTarget.style.display = "none";
                                  event.currentTarget.nextElementSibling?.classList.remove(
                                    styles.hiddenPlaceholder,
                                  );
                                }}
                              />
                            ) : null}

                            <div
                              className={`${styles.imagePlaceholder} ${
                                product.image_url
                                  ? styles.hiddenPlaceholder
                                  : ""
                              }`}
                            >
                              Image unavailable
                            </div>

                            <div className={styles.productInfo}>
                              <strong>{product.product_name}</strong>

                              {product.category && (
                                <span>{product.category}</span>
                              )}

                              {product.colour && (
                                <span>Colour: {product.colour}</span>
                              )}

                              {product.description && (
                                <p>{product.description}</p>
                              )}
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className={styles.loading}>
                <span className={styles.statusDot} />
                Finding products and styling your look...
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
                <span>Using your current product catalog</span>
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
