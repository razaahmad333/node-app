const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.type('html').send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Congratulations</title>
        <style>
          :root {
            --bg-top: #fff6d6;
            --bg-bottom: #ffd2a8;
            --card: rgba(255, 255, 255, 0.78);
            --text: #1f2937;
            --muted: #5b6472;
            --accent: #d9485f;
            --accent-2: #ff9f43;
            --shadow: 0 24px 60px rgba(120, 63, 4, 0.18);
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            padding: 24px;
            font-family: Georgia, "Times New Roman", serif;
            color: var(--text);
            background:
              radial-gradient(circle at top left, rgba(255, 255, 255, 0.95), transparent 32%),
              radial-gradient(circle at bottom right, rgba(255, 175, 87, 0.45), transparent 30%),
              linear-gradient(145deg, var(--bg-top), var(--bg-bottom));
          }

          .card {
            width: min(760px, 100%);
            padding: 48px 32px;
            border-radius: 28px;
            background: var(--card);
            backdrop-filter: blur(10px);
            box-shadow: var(--shadow);
            border: 1px solid rgba(255, 255, 255, 0.6);
            text-align: center;
          }

          .badge {
            display: inline-block;
            padding: 10px 16px;
            border-radius: 999px;
            background: linear-gradient(90deg, var(--accent), var(--accent-2));
            color: white;
            font: 700 0.78rem/1.1 Arial, sans-serif;
            letter-spacing: 0.16em;
            text-transform: uppercase;
          }

          h1 {
            margin: 24px 0 16px;
            font-size: clamp(2.2rem, 6vw, 4.8rem);
            line-height: 0.95;
          }

          p {
            margin: 0 auto;
            max-width: 620px;
            font: 1.1rem/1.7 Arial, sans-serif;
            color: var(--muted);
          }

          .highlight {
            color: var(--accent);
            font-weight: 700;
          }

          .stack {
            margin-top: 28px;
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 12px;
          }

          .chip {
            padding: 12px 18px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.82);
            border: 1px solid rgba(217, 72, 95, 0.15);
            font: 600 0.95rem/1 Arial, sans-serif;
          }
        </style>
      </head>
      <body>
        <main class="card">
          <div class="badge">Milestone Unlocked</div>
          <h1>Congratulations, Ahmad Raza Khan.</h1>
          <p>
            You are learning <span class="highlight">Jenkins</span> and
            <span class="highlight">Terraform</span>, which means you are moving beyond
            just writing code and into building real delivery systems.
          </p>
          <p style="margin-top: 16px;">
            That combination gives you the foundation to automate deployments,
            provision infrastructure cleanly, and think like an engineer who owns the full path to production.
          </p>
          <div class="stack">
            <span class="chip">CI/CD with Jenkins</span>
            <span class="chip">Infrastructure as Code</span>
            <span class="chip">Real DevOps Progress</span>
          </div>
        </main>
      </body>
    </html>
  `);
});


app.post('/payload', (req, res) => {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  req.on('end', () => {
    console.log('Received payload:', body);
    res.status(200).send('Payload received');
  });
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
