const styles = {
  container: {
    maxWidth: '600px',
    margin: '50px auto',
    padding: '30px',
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '12px',
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)',
    fontFamily: "'Roboto', sans-serif",
  },
  header: {
    textAlign: 'center',
    fontSize: '2rem',
    color: '#333',
    marginBottom: '20px',
    fontWeight: 700,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  label: {
    fontSize: '1.1rem',
    color: '#555',
  },
  input: {
    padding: '12px 15px',
    fontSize: '1rem',
    border: '1px solid #ccc',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.3s ease',
  },
  inputFocus: {
    borderColor: '#007bff',
  },
  submitButton: {
    padding: '12px 20px',
    fontSize: '1.1rem',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#007bff',
    color: '#fff',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease, transform 0.2s ease',
    marginTop: '10px',
  },
  submitButtonHover: {
    backgroundColor: '#0056b3',
  },
  errorText: {
    color: '#dc3545',
    fontSize: '1rem',
    marginTop: '10px',
    textAlign: 'center',
  },
};

export default styles;
