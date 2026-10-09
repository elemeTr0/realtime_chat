import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { supabase } from "./supabase";
import Intro from "./components/Intro";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Home from "./components/Home";
import "./App.css";

function AppRoutes() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function checkSession() {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Failed to get session:", error.message);
      }

      if (isActive) {
        setIsAuthenticated(!!data.session);
        setLoading(false);
      }
    }

    void checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (isActive) {
        setIsAuthenticated(!!session);
      }
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <div>Loading HOP...</div>;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={<IntroRoute isAuthenticated={isAuthenticated} />}
      />
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/home" replace /> : <LoginRoute />
        }
      />
      <Route
        path="/signup"
        element={
          isAuthenticated ? <Navigate to="/home" replace /> : <SignupRoute />
        }
      />
      <Route
        path="/home"
        element={
          isAuthenticated ? <HomeRoute /> : <Navigate to="/login" replace />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function IntroRoute({ isAuthenticated }: { isAuthenticated: boolean }) {
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return (
    <Intro
      onLogin={() => navigate("/login")}
      onSignup={() => navigate("/signup")}
    />
  );
}

function LoginRoute() {
  const navigate = useNavigate();

  return (
    <Login onBack={() => navigate("/")} onLogin={() => navigate("/home")} />
  );
}

function SignupRoute() {
  const navigate = useNavigate();

  return <Signup onBack={() => navigate("/")} />;
}

function HomeRoute() {
  const navigate = useNavigate();

  return <Home onLogout={() => navigate("/login")} />;
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
