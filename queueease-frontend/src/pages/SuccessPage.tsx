import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from '../styles/SuccessPage.styles';

interface QueueData {
  queue_id: number;
  service_name: string;
  current_position: number | null;
  status: string;
  expected_ready_time: string | null;
  total_wait?: number;
  time_created?: string;
}

const SuccessPage: React.FC = () => {
  const { queueId } = useParams<{ queueId: string }>();
  const navigate = useNavigate();

  const [queueData, setQueueData] = useState<QueueData | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [initialTime, setInitialTime] = useState<number>(0);
  const [completionTriggered, setCompletionTriggered] = useState<boolean>(false);

  useEffect(() => {
    const fetchQueueDetails = async () => {
      if (!queueId) return;
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/queue-detail/${queueId}/`);
        if (!response.ok) {
          throw new Error('Failed to fetch queue detail');
        }
        const data: QueueData = await response.json();
        setQueueData(data);

        if (data.expected_ready_time && data.total_wait !== undefined) {
          const expectedMs = new Date(data.expected_ready_time).getTime();
          const nowMs = Date.now();
          const diffSec = Math.max(0, Math.floor((expectedMs - nowMs) / 1000));
          setRemainingTime(diffSec);
          if (!initialTime && data.total_wait > 0) {
            setInitialTime(data.total_wait);
          }
        } else {
          setRemainingTime(0);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchQueueDetails();
    const intervalId = setInterval(fetchQueueDetails, 30000);
    return () => clearInterval(intervalId);
  }, [queueId, initialTime]);

  useEffect(() => {
    if (remainingTime <= 0) return;
    const timer = setInterval(() => {
      setRemainingTime(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [remainingTime]);

  useEffect(() => {
    if (remainingTime === 0 && queueData && queueData.status === 'pending' && !completionTriggered) {
      completeQueue(queueData.queue_id);
      setCompletionTriggered(true);
    }
  }, [remainingTime, queueData, completionTriggered]);

  const completeQueue = async (queueId: number) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/queue-complete/${queueId}/`, {
        method: 'POST',
      });
      if (response.ok) {
        console.log("Queue marked as completed");
        setQueueData(prev => prev ? { ...prev, status: 'completed' } : prev);
      } else {
        console.error("Failed to mark queue as completed.");
      }
    } catch (error) {
      console.error("Error in completeQueue:", error);
    }
  };

  const progressPercentage = initialTime
    ? ((initialTime - remainingTime) / initialTime) * 100
    : 0;

  const formatTime = (seconds: number) => {
    const mm = Math.floor(seconds / 60);
    const ss = seconds % 60;
    return `${mm}m ${ss}s`;
  };

  if (queueData?.status === 'completed') {
    return (
      <div style={styles.container as React.CSSProperties}>
        <div style={styles.icon}>✔️</div>
        <h1 style={styles.title}>Success!</h1>
        <p style={styles.message as React.CSSProperties}>Your order is complete!</p>
        <button style={styles.button} onClick={() => navigate('/main')}>Back to Main</button>
      </div>
    );
  }

  return (
    <div style={styles.container as React.CSSProperties}>
      <div style={styles.icon}>⌛</div>
      <h1 style={styles.title}>Order In Progress</h1>
      {queueData ? (
        <div style={styles.details}>
          <p style={styles.detailItem}><strong>Service:</strong> {queueData.service_name}</p>
          <p style={styles.detailItem}><strong>Your Queue ID:</strong> {queueData.queue_id}</p>
          <p style={styles.detailItem}><strong>Current Position:</strong> {queueData.current_position ?? 'N/A'}</p>
          <p style={styles.detailItem}><strong>Estimated Time Remaining:</strong> {formatTime(remainingTime)}</p>
          
          <div style={styles.progressContainer}>
            <div
              style={{
                ...styles.progressBar,
                width: `${Math.min(progressPercentage, 100)}%`
              }}
            />
          </div>

          <button style={styles.button} onClick={() => navigate('/main')}>Back to Main</button>
        </div>
      ) : (
        <p style={styles.message as React.CSSProperties}>Loading queue details...</p>
      )}
    </div>
  );
};

export default SuccessPage;
