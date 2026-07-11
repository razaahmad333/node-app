const packageJson = require("./package.json");
const deployPath = process.env.DEPLOY_PATH || `/var/www/${packageJson.name}`;

module.exports = {
  apps: [
    {
      name: packageJson.name,
      cwd: `${deployPath}/current`,
      script: "index.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
        SAMPLE_SECRET: process.env.SAMPLE_SECRET,
      },
    },
  ],
};
