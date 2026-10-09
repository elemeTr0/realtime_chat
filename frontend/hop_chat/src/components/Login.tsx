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

        const email = (formData.get("email") as string).trim();
        const password = formData.get("password") as string;

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setError("Invalid email or password.");
                return;
            }

            onLogin();
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="login">
            <h1>Log in to HOP</h1>

            <form onSubmit={handleSubmit}>
                <label htmlFor="email">Email</label>
                <input
                    id="email"
                    type="email"
                    name="email"
                    autoComplete="email"
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