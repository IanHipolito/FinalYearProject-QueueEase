import React, { useState } from "react";
import { API } from "../services/api";

const ValidateQR: React.FC = () => {
  interface QueueDetails {
    id: string;
    service: string;
    status: string;
  }

  const [queueDetails, setQueueDetails] = useState<QueueDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const validateQRCode = async (qrHash: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await API.queues.validateQR(qrHash);
      setQueueDetails(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : "An unknown error occurred");
      setQueueDetails(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h1>Validate QR Code</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading && <p>Loading...</p>}
      {queueDetails ? (
        <div>
          <p>Queue ID: {queueDetails.id}</p>
          <p>Service: {queueDetails.service}</p>
          <p>Status: {queueDetails.status}</p>
        </div>
      ) : (
        <button 
          onClick={() => validateQRCode("scanned_qr_hash")}
          disabled={loading}
        >
          Validate QR Code
        </button>
      )}
    </div>
  );
};

export default ValidateQR;
