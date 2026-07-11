const os = require('os');
const express = require('express');

const app = express();

function getServerIp() {
  const interfaces = os.networkInterfaces();

  for (const addresses of Object.values(interfaces)) {
    if (!addresses) {
      continue;
    }

    for (const address of addresses) {
      if (address.family === 'IPv4' && !address.internal) {
        return address.address;
      }
    }
  }

  return 'unknown';
}

function getSecretPreview(secret) {
  if (!secret) {
    return 'not loaded';
  }

  if (secret.length <= 4) {
    return `${secret[0]}***`;
  }

  return `${secret.slice(0, 2)}***${secret.slice(-2)}`;
}

app.get('/', (req, res) => {
  const serverIp = getServerIp();
  const serverName = os.hostname();
  const sampleSecretPreview = getSecretPreview(process.env.SAMPLE_SECRET);

  res.type('html').send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Congratulations</title>
        <style>
          :root {
            --bg-top: #eef6ff;
            --bg-bottom: #c6e3ff;
            --card: rgba(255, 255, 255, 0.8);
            --text: #102033;
            --muted: #516174;
            --accent: #0f766e;
            --accent-2: #f59e0b;
            --accent-3: #1d4ed8;
            --shadow: 0 28px 70px rgba(17, 55, 99, 0.16);
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
              radial-gradient(circle at top left, rgba(255, 255, 255, 0.98), transparent 30%),
              radial-gradient(circle at bottom right, rgba(29, 78, 216, 0.18), transparent 32%),
              radial-gradient(circle at center right, rgba(245, 158, 11, 0.16), transparent 24%),
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
            background: linear-gradient(90deg, var(--accent), var(--accent-3));
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
            border: 1px solid rgba(15, 118, 110, 0.16);
            font: 600 0.95rem/1 Arial, sans-serif;
          }

          .grid {
            margin-top: 32px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
            gap: 14px;
            text-align: left;
          }

          .panel {
            padding: 18px;
            border-radius: 20px;
            background: rgba(255, 255, 255, 0.74);
            border: 1px solid rgba(16, 32, 51, 0.08);
          }

          .panel strong {
            display: block;
            margin-bottom: 8px;
            font: 700 0.92rem/1.2 Arial, sans-serif;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            color: var(--accent-3);
          }

          .panel span {
            font: 1rem/1.6 Arial, sans-serif;
            color: var(--muted);
          }

          .footer {
            margin-top: 28px;
            padding-top: 18px;
            border-top: 1px solid rgba(16, 32, 51, 0.1);
            font: 0.95rem/1.6 Arial, sans-serif;
            color: var(--muted);
          }

          .footer code {
            padding: 2px 8px;
            border-radius: 999px;
            background: rgba(16, 32, 51, 0.08);
            color: var(--text);
          }

          .secret {
            margin-top: 16px;
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 12px 16px;
            border-radius: 16px;
            background: rgba(16, 32, 51, 0.06);
            font: 0.95rem/1.4 Arial, sans-serif;
            color: var(--muted);
          }

          .secret strong {
            color: var(--text);
          }
        </style>
      </head>
      <body>
        <main class="card">
          <div class="badge">DevOps Milestone Unlocked</div>
          <h1>Congratulations, Ahmad Raza Khan.</h1>
          <p>
            You are learning <span class="highlight">Jenkins</span> and
            <span class="highlight">Terraform</span> and turning that into a real delivery system:
            infrastructure on AWS, application bootstrapping, and automated multi-node deployment.
          </p>
          <p style="margin-top: 16px;">
            This stack shows that you are no longer only shipping code. You are provisioning
            networks, securing traffic paths, wiring a load balancer, and pushing repeatable releases
            across multiple EC2 instances through Jenkins.
          </p>
          <div class="stack">
            <span class="chip">Jenkins CI/CD Pipelines</span>
            <span class="chip">Terraform IaC on AWS</span>
            <span class="chip">ALB + Multi-EC2 Delivery</span>
            <span class="chip">Nginx Reverse Proxy</span>
            <span class="chip">PM2 Process Management</span>
            <span class="chip">Health-Checked Releases</span>
          </div>
          <div class="grid">
            <div class="panel">
              <strong>Terraform</strong>
              <span>VPC, subnets, route tables, internet gateway, security groups, EC2 instances, target groups, and an application load balancer.</span>
            </div>
            <div class="panel">
              <strong>Bootstrap</strong>
              <span>Automated server setup with user data: Node.js, npm, PM2, Nginx, deploy user, SSH key installation, and first release provisioning.</span>
            </div>
            <div class="panel">
              <strong>Delivery</strong>
              <span>Jenkins packages the app, ships one artifact to both EC2 nodes over SSH, switches the live symlink, and restarts the process cleanly.</span>
            </div>
            <div class="panel">
              <strong>Operations</strong>
              <span>ALB health checks route traffic only to healthy targets, while your pipeline verifies the public <code>/health</code> endpoint after deployment.</span>
            </div>
          </div>
          <div class="secret">
            <strong>SAMPLE_SECRET</strong>
            <code>${sampleSecretPreview}</code>
          </div>
          <div class="footer">
            Served by instance <code>${serverName}</code> on IP <code>${serverIp}</code>.
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

module.exports = app;
