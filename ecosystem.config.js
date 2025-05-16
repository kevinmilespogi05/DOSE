module.exports = {
  apps: [{
    name: "pharmacy-management-system",
    script: "./src/api/server.ts",
    interpreter: "tsx",
    env: {
      NODE_ENV: "production",
    }
  }]
} 