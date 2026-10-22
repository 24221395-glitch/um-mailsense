import { useNavigate } from "react-router-dom";
import { loginUrl } from "../api/auth";
import { USE_MOCKS } from "../api/client";

export default function LoginPage() {
  const navigate = useNavigate();
  const signIn = () => {
    if (USE_MOCKS) navigate("/inbox");
    else window.location.href = loginUrl;
  };
  return (
    <div className="grid min-h-screen place-items-center bg-navy px-4 text-white">
      <div className="max-w-md text-center">
        <h1 className="text-4xl font-extrabold">
          UM <span className="text-gold">MailSense</span>
        </h1>
        <p className="mt-3 text-white/80">
          Your Siswamail, sorted. Hackathons, research posts, UM notices and events, each in its own
          place, with picks matched to your CV.
        </p>
        <button
          onClick={signIn}
          className="mt-8 rounded-xl bg-gold px-6 py-3 font-bold text-slate-900 hover:brightness-105"
        >
          Sign in with Siswamail
        </button>
        <p className="mt-4 text-xs text-white/60">
          Read-only access to your own mailbox. You can disconnect at any time.
        </p>
      </div>
    </div>
  );
}
