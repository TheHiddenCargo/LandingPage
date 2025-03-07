import React from 'react';

const Navbar = () => {
  return (
    <nav style={styles.navbar}>
      <a href="#que-es-el-juego" style={styles.link}>¿Qué es el juego?</a>
      <a href="#como-jugar" style={styles.link}>Cómo jugar</a>
      <a href="#registro" style={styles.link}>Registro</a>
    </nav>
  );
};

const styles = {
  navbar: {
    display: 'flex',
    justifyContent: 'space-around',
    backgroundColor: '#333',
    padding: '1rem',
  },
  link: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '1.2rem',
  },
};

export default Navbar;
