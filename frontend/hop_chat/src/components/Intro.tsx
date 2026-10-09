
import hopLogo from '../assets/HOPlogo.png';

type IntroProps = {
    onLogin: () => void;
    onSignup: () => void;
};

function Intro({ onLogin, onSignup }: IntroProps) {
    return (
        <main className="intro">
            <img
                src={hopLogo}
                alt="HOP logo"
                className="logo"
            />

            <p>Your conversations, all in one place.</p>

            <div className="intro-buttons">
                <button onClick={onLogin}>
                    HOP in
                </button>

                <button onClick={onSignup}>
                    New to HOP?
                </button>
            </div>
        </main>
    );
}

export default Intro;