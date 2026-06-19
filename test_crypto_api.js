// Node script to test auth, accounts, and crypto endpoints
async function run() {
  const email = `test_${Date.now()}@example.com`;
  const password = 'TestPassword123!';
  const fullName = 'Test User';
  const phone = '+1' + Math.floor(1000000000 + Math.random() * 9000000000);

  console.log('1. Registering user...');
  let res = await fetch('http://localhost:4000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName, email, password, phone })
  });
  if (!res.ok) {
    console.error('Registration failed:', await res.text());
    return;
  }
  const regUser = await res.json();
  console.log('Registered user:', regUser);

  console.log('2. Logging in...');
  res = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    console.error('Login failed:', await res.text());
    return;
  }
  const loginResult = await res.json();
  console.log('Login result:', loginResult);
  const token = loginResult.accessToken;

  console.log('3. Getting user accounts...');
  res = await fetch('http://localhost:4000/api/accounts', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) {
    console.error('Failed to get accounts:', await res.text());
  } else {
    console.log('Accounts list:', await res.json());
  }

  console.log('4. Getting crypto markets...');
  res = await fetch('http://localhost:4000/api/crypto/markets', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) {
    console.error('Failed to get crypto markets:', await res.text());
  } else {
    const markets = await res.json();
    console.log(`Markets returned ${markets.length} coins.`);
    if (markets.length > 0) {
      console.log('First coin sample:', {
        id: markets[0].id,
        name: markets[0].name,
        price: markets[0].current_price,
        image: markets[0].image
      });
    }
  }
}

run().catch(console.error);
