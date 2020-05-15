module.exports = {
  apps : [
      {
        name: "Logos interact",
        script: "node -- interact.js",
        watch: true,
        node_args: [
          "--inspect-brk=7000"
        ],
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
