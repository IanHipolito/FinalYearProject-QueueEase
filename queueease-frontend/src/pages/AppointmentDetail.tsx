import React, { ReactComponentElement, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from '../styles/AppointmentDetails.styles';

interface AppointmentDetail {
  order_id: string;
  appointment_date: string;
  appointment_time: string;
  service_name: string;
  queue_status: string;
  estimated_wait_time: number;
  queue_position: number;
  appointment_title: string;
}

const AppointmentDetail: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`http://localhost:8000/api/appointment/${orderId}/`)
      .then(response => response.json())
      .then(data => {
        setAppointment(data);
        setRemainingTime(data.estimated_wait_time * 60);
      })
      .catch(error => console.error('Error fetching appointment details:', error));
  }, [orderId]);

  useEffect(() => {
    if (remainingTime > 0) {
      const timer = setInterval(() => {
        setRemainingTime(prevTime => prevTime - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [remainingTime]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  return (
    <div style={styles.container}>
      <button style={styles.backButton} onClick={() => navigate(-1)}>&lt; Back</button>
      <h1 style={styles.header as React.CSSProperties}>Appointment Details</h1>
      {appointment ? (
        <div style={styles.detailCard}>
          <h2 style={styles.detailItem}>{appointment.appointment_title}</h2>
          <p style={styles.detailItem}><strong>Order ID:</strong> {appointment.order_id}</p>
          <p style={styles.detailItem}><strong>Service:</strong> {appointment.service_name}</p>
          <p style={styles.detailItem}><strong>Queue Status:</strong> {appointment.queue_status}</p>
          <p style={styles.detailItem}><strong>Queue Position:</strong> {appointment.queue_position}</p>
          <p style={styles.detailItem}>
            <strong>Appointment Date:</strong> {new Date(appointment.appointment_date).toLocaleDateString()}
          </p>
          <p style={styles.detailItem}><strong>Appointment Time:</strong> {appointment.appointment_time}</p>
          <p style={styles.detailItem}><strong>Estimated Waiting Time:</strong> {appointment.estimated_wait_time} minutes</p>
          <p style={styles.timer}><strong>Time Remaining:</strong> {formatTime(remainingTime)}</p>
        </div>
      ) : (
        <p style={{ textAlign: 'center' }}>Loading appointment details...</p>
      )}
    </div>
  );
};

export default AppointmentDetail;
