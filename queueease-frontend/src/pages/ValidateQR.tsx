import React, { useState } from "react";

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
      const response = await fetch(`/api/validate-qr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrHash }),
      });
      if (!response.ok) {
        throw new Error("Invalid QR Code.");
      }
      const data = await response.json();
      setQueueDetails(data);
    } catch (error) {
      setError((error as Error).message);
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
