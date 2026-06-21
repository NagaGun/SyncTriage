const http = require('http');

const data = JSON.stringify({
  transcript: "Sarah will send the updated deck to the client by Friday. Tom needs to set up the Vercel deployment. We decided to go with Next.js.",
  userId: null // anonymous test
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/triage',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  let body = '';
  res.on('data', d => {
    body += d;
  });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', body);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
