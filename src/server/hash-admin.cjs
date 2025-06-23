const bcrypt = require('bcrypt');

bcrypt.hash('admin', 12).then(hash => {
  console.log('Hash para la contraseña "admin":');
  console.log(hash);
  process.exit(0);
}); 