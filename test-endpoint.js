const url = 'https://ecommerce-mern-razorpay.onrender.com/api/auth/signup';

fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Origin': 'https://e-commerce-mern-razorpay.vercel.app'
  },
  body: JSON.stringify({
    name: 'Test3',
    email: 'test3_' + Date.now() + '@test.com',
    password: 'password123'
  })
})
.then(async res => {
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Body:', text);
})
.catch(err => {
  console.error('Fetch error:', err.message);
});
