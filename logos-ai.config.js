module.exports = {
  apps : [
      {
        name: "Logos",
        script: "node app.js",
        watch: true,
        env: {
          "MYSQL_USER":"logos",
          "MYSQL_PASSWORD":"sparkle8twilight",
          "MYSQL_DATABASE":"logos",
          "MYSQL_HOST":"127.0.0.1",
          "MYSQL_PORT":33060,
	  "OPENAI_API_KEY":"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",
        }
      }
  ]
}
