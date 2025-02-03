import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface AppointmentDetail {
  order_id: string;
  appointment_date: string;
  service: string;
  queue_status: string;
  estimated_wait_time: number;
}

const AppointmentDetail: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`http://localhost:8000/api/appointment/${orderId}/`)
      .then(response => response.json())
      .then(data => setAppointment(data))
      .catch(error => console.error('Error fetching appointment details:', error));
  }, [orderId]);

  return (
    <div>
      <button onClick={() => navigate(-1)}>&lt;</button>
      <h1>Appointment Details</h1>
      {appointment ? (
        <div style={{ backgroundColor: '#ddd', padding: '20px' }}>
          <h2>Appointment Title</h2>
          <p>ID: {appointment.order_id}</p>
          <p>Queue Status: {appointment.queue_status}</p>
          <p>Estimated Waiting Time: {appointment.estimated_wait_time} minutes</p>
          <p>Date: {new Date(appointment.appointment_date).toLocaleString()}</p>
        </div>
      ) : (
        <p>Loading appointment details...</p>
      )}
    </div>
  );
};

export default AppointmentDetail;
