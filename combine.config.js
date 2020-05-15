module.exports = {
  apps : [
      {
        name: "Logos combinator",
        script: "node -- combine.js",
        watch: true,
        autorestart : false,
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
