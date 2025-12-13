import fetch from 'node-fetch';

const res = await fetch('http://localhost:3000/api/registro', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@ejemplo.com',
    password: '123456'
  })
});

const data = await res.json();
console.log('✅ Respuesta del servidor:', data);
