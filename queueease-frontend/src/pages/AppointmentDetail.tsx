import React, { useEffect, useState } from 'react';
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
  expected_start_time: string;
}

const AppointmentDetail: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAppointment = () => {
      fetch(`http://localhost:8000/api/appointment/${orderId}/`)
        .then(response => response.json())
        .then(data => {
          setAppointment(data);
        })
        .catch(error => console.error('Error fetching appointment details:', error));
    };

    fetchAppointment();
    const pollingInterval = setInterval(fetchAppointment, 60000);
    return () => clearInterval(pollingInterval);
  }, [orderId]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (appointment) {
      const updateRemainingTime = () => {
        const expectedTime = new Date(appointment.expected_start_time).getTime();
        const diffInSeconds = Math.max(0, Math.floor((expectedTime - Date.now()) / 1000));
        setRemainingTime(diffInSeconds);
      };
      updateRemainingTime();
      timer = setInterval(updateRemainingTime, 1000);
    }
    return () => timer && clearInterval(timer);
  }, [appointment]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const progressPercentage = appointment ? (remainingTime / (appointment.estimated_wait_time * 60)) * 100 : 0;

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
          <div style={{ marginTop: '20px' }}>
            <div style={{
              width: '100%',
              height: '20px',
              backgroundColor: '#e0e0e0',
              borderRadius: '10px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progressPercentage}%`,
                height: '100%',
                backgroundColor: '#76c7c0',
                transition: 'width 1s linear'
              }}></div>
            </div>
            <p style={{ textAlign: 'center' }}>{formatTime(remainingTime)} remaining</p>
          </div>
        </div>
      ) : (
        <p style={{ textAlign: 'center' }}>Loading appointment details...</p>
      )}
    </div>
  );
};

export default AppointmentDetail;
