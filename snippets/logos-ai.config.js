module.exports = {
  apps : [
      {
        name: "Logos AI",
        script: "node -- app.js",
        watch: true,
        autorestart : false,
        env: {
          "MYSQL_USER":"logos",
          "MYSQL_PASSWORD":"<password>",
          "MYSQL_DATABASE":"logos",
          "MYSQL_HOST":"localhost",
          "OPENAI_API_KEY":"<key>",
        }
      }
  ]
}
