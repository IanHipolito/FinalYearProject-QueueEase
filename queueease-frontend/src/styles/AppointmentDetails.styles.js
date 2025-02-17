const styles = {
  container: {
    maxWidth: '900px',
    margin: '40px auto',
    padding: '40px',
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
    fontFamily: "'Roboto', sans-serif",
  },
  backButton: {
    backgroundColor: '#1a73e8',
    color: '#fff',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease, transform 0.2s ease',
    marginBottom: '30px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
    fontSize: '2.5rem',
    color: '#202124',
    fontWeight: 700,
    letterSpacing: '1px',
  },
  detailCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
    marginBottom: '30px',
  },
  detailItem: {
    margin: '12px 0',
    fontSize: '1.2rem',
    color: '#333',
    lineHeight: 1.5,
  },
  timer: {
    fontSize: '1.5rem',
    color: '#d93025',
    fontWeight: 600,
    marginTop: '20px',
  },
};

export default styles;
