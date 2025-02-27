import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import styles from "../styles/ServiceSelection.styles";

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
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [filterText, setFilterText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const [buttonHover, setButtonHover] = useState<number | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const loggedInUserId = user ? user.id : null;

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axios.get<Service[]>("http://127.0.0.1:8000/api/list_services/");
        setServices(response.data);
        setFilteredServices(response.data);
        setLoading(false);
      } catch (err: any) {
        setError("Failed to fetch services.");
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  useEffect(() => {
    if (filterText.trim() === "") {
      setFilteredServices(services);
    } else {
      const lowerFilter = filterText.toLowerCase();
      const filtered = services.filter(
        (service) =>
          service.name.toLowerCase().includes(lowerFilter) ||
          service.description.toLowerCase().includes(lowerFilter)
      );
      setFilteredServices(filtered);
    }
  }, [filterText, services]);

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
    return (
      <div style={{ textAlign: "center", marginTop: "40px" }}>
        Loading services...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ color: "red", textAlign: "center", marginTop: "40px" }}>
        {error}
      </div>
    );
  }

  return (
    <div style={styles.container as React.CSSProperties}>
      <h2 style={styles.header}>Select a Service</h2>
      <input
        type="text"
        placeholder="Search services..."
        value={filterText}
        onChange={(e) => setFilterText(e.target.value)}
        style={styles.filterInput as React.CSSProperties}
      />
      <ul style={styles.list as React.CSSProperties}>
        {filteredServices.map((service) => {
          const isHovered = hoveredItem === service.id;
          return (
            <li
              key={service.id}
              style={{
                ...styles.listItem,
                ...(isHovered ? styles.listItemHover : {}),
              } as React.CSSProperties}
              onMouseEnter={() => setHoveredItem(service.id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <button
                style={{
                  ...styles.button,
                  ...(buttonHover === service.id ? styles.buttonHover : {}),
                }}
                onMouseEnter={() => setButtonHover(service.id)}
                onMouseLeave={() => setButtonHover(null)}
                onClick={() => handleServiceSelect(service.id)}
              >
                {service.name}
              </button>
              <p style={styles.description as React.CSSProperties}>
                {service.description}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ServiceSelection;
