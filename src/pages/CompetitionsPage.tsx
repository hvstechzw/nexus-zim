import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function CompetitionsPage() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/inter-school", { replace: true });
  }, [navigate]);
  return null;
}
