import { useState } from "react";
import { supabase } from "../supabase";
import "../../styles/Signup.css";

type SignupProps = {
    onBack: () => void;
};

function Signup({ onBack }: SignupProps) {
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError("");
        setMessage("");

        const formData = new FormData(event.currentTarget);

        const username = (formData.get("username") as string).trim();
        const email = (formData.get("email") as string).trim();
        const password = formData.get("password") as string;
        const confirmPassword = formData.get("confirm") as string;

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (username.length < 3) {
            setError("Username must be at least 3 characters.");
            return;
        }

        setIsSubmitting(true);

        try {
            // Check username availability only after form submission.
            const { data: existingUser, error: checkError } = await supabase
                .from("profiles")
                .select("id")
                .ilike("username", username)
                .limit(1);

            if (checkError) {
                setError("Couldn't check username. Please try again.");
                return;
            }

            if (existingUser.length > 0) {
                setError("This username is already taken.");
                return;
            }

            const { data, error: signupError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { username },
                    emailRedirectTo: window.location.origin,
                },
            });

            if (signupError) {
                setError(signupError.message);
                return;
            }

            if (data.session) {
                setMessage("Account created successfully!");
            } else {
                setMessage(
                    "If this email is available, you'll receive a confirmation email shortly.",
                );
            }
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="signup">
            <h1>Sign up</h1>

            <form onSubmit={handleSubmit}>
                <label htmlFor="username">Username</label>
                <input
                    id="username"
                    type="text"
                    name="username"
                    minLength={3}
                    required
                />

                <label htmlFor="email">Email</label>
                <input id="email" type="email" name="email" required />

                <label htmlFor="password">Password</label>
                <input id="password" type="password" name="password" required />

                <label htmlFor="confirm">Confirm Password</label>
                <input id="confirm" type="password" name="confirm" required />

                {error && <p className="error">{error}</p>}
                {message && <p className="success">{message}</p>}

                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating account..." : "Create account"}
                </button>
            </form>

            <p>
                Already have an account? <a href="/login">Log in</a>
            </p>

            <button type="button" onClick={onBack}>
                Back
            </button>
        </main>
    );
}

export default Signup;
