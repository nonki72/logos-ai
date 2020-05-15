module.exports = {
  apps : [
      {
        name: "Logos",
        script: "./app.js",
        watch: true,
        autorestart : true,
        env: {
	  "MONGO_CONNECTION_STRING":"mongodb://localhost:27017/",
          "MYSQL_USER":"logos",
          "MYSQL_PASSWORD":"sparkle8twilight",
          "MYSQL_DATABASE":"logos",
          "MYSQL_HOST":"localhost",
          "MYSQL_PORT":"33060"
        }
      }
  ]
}
