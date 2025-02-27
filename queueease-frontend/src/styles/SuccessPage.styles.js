const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "80vh",
    padding: "20px",
    backgroundColor: "#f6f8fa",
  },
  icon: {
    fontSize: "4rem",
    color: "#28a745",
    marginBottom: "20px",
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: "bold",
    color: "#333",
    marginBottom: "10px",
  },
  message: {
    fontSize: "1.2rem",
    color: "#555",
    marginBottom: "20px",
    textAlign: "center",
  },
  details: {
    backgroundColor: "#fff",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    padding: "20px",
    marginBottom: "30px",
    width: "90%",
    maxWidth: "500px",
  },
  detailItem: {
    margin: "10px 0",
    fontSize: "1.1rem",
    color: "#333",
  },
  button: {
    padding: "12px 30px",
    fontSize: "1rem",
    backgroundColor: "#007BFF",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
  },
  buttonHover: {
    backgroundColor: "#0056b3",
  },
  progressContainer: {
    margin: "20px auto",
    width: "100%",
    maxWidth: "400px",
    backgroundColor: "#eee",
    height: "20px",
    borderRadius: "10px",
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#76c7c0",
    transition: "width 1s linear",
  },
};

export default styles;
