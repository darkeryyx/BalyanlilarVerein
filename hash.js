const bcrypt = require('bcryptjs');

const password = 'admin123'; // Dein Passwort hier eingeben
bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Fehler beim Erzeugen des Hashs', err);
  } else {
    console.log('Hash für das Passwort:', hash);
  }
});
