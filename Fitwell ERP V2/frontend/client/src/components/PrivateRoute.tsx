import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth/check", { credentials: "include" })
      .then((res) => setOk(res.ok))
      .catch(() => setOk(false));
  }, []);

  if (ok === null) return <p>Checking auth...</p>;

  return ok ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
