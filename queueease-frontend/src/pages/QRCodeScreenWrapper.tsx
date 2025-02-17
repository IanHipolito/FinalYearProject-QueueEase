import React from "react";
import { useParams } from "react-router-dom";
import QRCodeScreen from "./QRCodeScreen";

const QRCodeScreenWrapper: React.FC = () => {
  const { queueId } = useParams<{ queueId: string }>();

  if (!queueId) return <p>Missing queue ID.</p>;

  const parsedQueueId = parseInt(queueId, 10);
  if (isNaN(parsedQueueId)) return <p>Invalid queue ID.</p>;

  return <QRCodeScreen queueId={parsedQueueId} />;
};

export default QRCodeScreenWrapper;