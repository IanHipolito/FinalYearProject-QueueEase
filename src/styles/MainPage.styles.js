const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f5f5f5',
        minHeight: '100vh',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#000000',
        padding: '10px 20px',
    },
    titleText: {
        color: '#ffffff',
        fontSize: '28px',
        fontWeight: 'bold',
        fontFamily: "'Bebas Neue', sans-serif",
        margin: 0,
    },
    banner: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '200px',
        color: '#ffffff',
        fontSize: '45px',
        fontWeight: 'bold',
        fontFamily: "'Bebas Neue', sans-serif",
        background: 'linear-gradient(90deg, #2C67F2 0%, #62CFF4 100%)',
    },
    buttonContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        flex: 1,
        padding: '20px',
    },
    iconButtonWrapper: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '20px 0',
        backgroundColor: '#e0e0e0',
        borderRadius: '10px',
        padding: '20px',
        width: '50%',
        cursor: 'pointer',
        transition: 'background-color 0.3s ease',
    },
    buttonLabel: {
        marginTop: '5px',
        fontSize: '14px',
        color: '#333',
        textAlign: 'center',
        fontFamily: "'Bebas Neue', sans-serif",
        fontWeight: 'bold',
    },
};

export default styles;
