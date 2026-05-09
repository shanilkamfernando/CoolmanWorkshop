import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const WorkshopPortal = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/purchasing/workshop/customers", { replace: true });
  }, []);

  return null;
};

export default WorkshopPortal;
