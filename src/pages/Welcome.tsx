import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Welcome = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to home immediately since this is customer-only app
    navigate("/home", { replace: true });
  }, [navigate]);

  return null;
};

export default Welcome;
