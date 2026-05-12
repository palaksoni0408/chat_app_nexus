"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import api from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!identifier.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/api/auth/local", {
        identifier: identifier.trim(),
        password,
      });
      const { jwt, user } = res.data;
      Cookies.set("token", jwt, { expires: 7 });
      Cookies.set("user", JSON.stringify({ id: user.id, username: user.username }), { expires: 7 });
      router.replace("/chat");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setError(msg || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-wrapper">
      <div className="card">
        <div className="logo-mark">💬</div>
        <h1 className="card-title">Welcome back</h1>
        <p className="card-subtitle">Sign in to continue to Nexus Chat</p>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username or Email</label>
            <input
              type="text"
              className="form-input"
              placeholder="your_username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="link-row">
          No account?{" "}
          <Link href="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
