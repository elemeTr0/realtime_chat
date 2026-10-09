import { Router } from "express";
import { supabaseAdmin, supabaseAuth } from "./supabase.js";

const router = Router();

router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    if (
        typeof username !== "string" ||
        typeof password !== "string" ||
        !username.trim() ||
        !password
    ) {
        return res.status(400).json({
            error: "Username and password are required.",
        });
    }

    try {
        const { data: profile, error: profileError } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .eq("username", username.trim())
            .maybeSingle();

        if (profileError || !profile) {
            return res.status(401).json({
                error: "Invalid username or password.",
            });
        }

        const { data: userData, error: userError } =
            await supabaseAdmin.auth.admin.getUserById(profile.id);

        const email = userData.user?.email;

        if (userError || !email) {
            return res.status(401).json({
                error: "Invalid username or password.",
            });
        }

        const { data: loginData, error: loginError } =
            await supabaseAuth.auth.signInWithPassword({
                email,
                password,
            });

        if (loginError || !loginData.session) {
            return res.status(401).json({
                error: "Invalid username or password.",
            });
        }

        return res.json({
            session: loginData.session,
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            error: "Something went wrong.",
        });
    }
});

export default router;
