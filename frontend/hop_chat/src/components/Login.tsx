import { useState } from "react";
import { supabase } from "../supabase";
import "../../styles/Login.css";

type LoginProps = {
    onBack: () => void;
    onLogin: () => void;
};

function Login({ onBack, onLogin }: LoginProps) {
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setIsSubmitting(true);

        const formData = new FormData(event.currentTarget);
        const username = (formData.get("username") as string).trim();
        const password = formData.get("password") as string;

        try {
            const response = await fetch("http://localhost:3000/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            const result = await response.json();

            if (!response.ok) {
                setError(result.error || "Invalid username or password.");
                return;
            }

            const { error: sessionError } = await supabase.auth.setSession({
                access_token: result.session.access_token,
                refresh_token: result.session.refresh_token,
            });

            if (sessionError) {
                setError("Login failed. Please try again.");
                return;
            }

            onLogin();
        } catch {
            setError("Could not connect to the server. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="login">
            <h1>Log in to HOP</h1>

            <form onSubmit={handleSubmit}>
                <label htmlFor="username">Username</label>
                <input
                    id="username"
                    type="text"
                    name="username"
                    autoComplete="username"
                    required
                />

                <label htmlFor="password">Password</label>
                <input
                    id="password"
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    required
                />

                {error && <p className="error">{error}</p>}

                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Logging in..." : "Log in"}
                </button>
            </form>

            <p>
                Don't have an account? <a href="/signup">Sign up</a>
            </p>

            <button type="button" onClick={onBack}>
                Back
            </button>
        </main>
    );
}

export default Login;
