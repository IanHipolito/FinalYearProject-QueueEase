const styles = {
  container: {
    textAlign: "center",
    marginTop: "20px",
  },
  scannerContainer: {
    position: "relative",
    width: "300px",
    height: "300px",
    margin: "auto",
  },
  scanner: {
    width: "300px",
    height: "300px",
    margin: "auto",
    border: "2px solid black",
  },
  overlay: {
    position: "absolute",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    border: "10px solid green",
    boxSizing: "border-box",
    pointerEvents: "none",
  },
  error: {
    color: "red",
  },
};

export default styles;
