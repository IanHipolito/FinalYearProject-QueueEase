import React, { useState, useEffect } from "react";

interface QRCodeScreenProps {
  queueId: number;
}

const QRCodeScreen: React.FC<QRCodeScreenProps> = ({ queueId }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!queueId) {
      setError("Invalid Queue ID");
      return;
    }
    // For Local Testing
    const qrCodeEndpoint = `http://127.0.0.1:8000/api/get-qr-code/${queueId}/`;
    setQrCodeUrl(qrCodeEndpoint);
  }, [queueId]);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>QR Code</h1>
      {error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        qrCodeUrl && (
          <img
            src={qrCodeUrl}
            alt="QR Code"
            style={{
              width: "300px",
              height: "300px",
              border: "1px solid #000",
              margin: "20px auto",
            }}
          />
        )
      )}
      <p>Scan this QR code to proceed.</p>
    </div>
  );
};

export default QRCodeScreen;
