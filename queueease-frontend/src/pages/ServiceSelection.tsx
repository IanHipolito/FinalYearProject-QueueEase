import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

interface Service {
  id: number;
  name: string;
  description: string;
}

interface CreateQueueResponse {
  queue_id: number;
  user: string;
  service: string;
  sequence_number: number;
  qr_hash: string;
  message: string;
}

const ServiceSelection: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const loggedInUserId = user ? user.id : null;

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axios.get<Service[]>("http://127.0.0.1:8000/api/list_services/");
        setServices(response.data);
        setLoading(false);
      } catch (err: any) {
        setError("Failed to fetch services.");
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const handleServiceSelect = async (serviceId: number) => {
    if (!loggedInUserId) {
      setError("User not logged in.");
      return;
    }
    try {
      const response = await axios.post<CreateQueueResponse>(
        "http://127.0.0.1:8000/api/create-queue/",
        {
          user_id: loggedInUserId,
          service_id: serviceId,
        }
      );
      const { queue_id } = response.data;
      navigate(`/qrcodescreen/${queue_id}`);
    } catch (error) {
      console.error("Error creating queue", error);
      setError("Failed to create queue.");
    }
  };

  if (loading) {
    return <div>Loading services...</div>;
  }

  if (error) {
    return <div style={{ color: "red" }}>{error}</div>;
  }

  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <h2>Select a Service</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {services.map((service) => (
          <li key={service.id} style={{ margin: "10px 0" }}>
            <button onClick={() => handleServiceSelect(service.id)}>
              {service.name}
            </button>
            <p>{service.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ServiceSelection;
