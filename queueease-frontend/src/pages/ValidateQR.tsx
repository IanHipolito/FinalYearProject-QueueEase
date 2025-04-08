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

  const validateQRCode = async (qrHash: string) => {
    try {
      const response = await API.queues.validateQR(qrHash);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Invalid QR Code");
      }
      const data = await response.json();
      setQueueDetails(data);
      setError(null);
    } catch (error) {
      setError((error as Error).message);
      setQueueDetails(null);
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h1>Validate QR Code</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {queueDetails ? (
        <div>
          <p>Queue ID: {queueDetails.id}</p>
          <p>Service: {queueDetails.service}</p>
          <p>Status: {queueDetails.status}</p>
        </div>
      ) : (
        <button onClick={() => validateQRCode("scanned_qr_hash")}>
          Validate QR Code
        </button>
      )}
    </div>
  );
};

export default ValidateQR;
