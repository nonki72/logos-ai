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
          "MYSQL_USER":"logos",
          "MYSQL_PASSWORD":"sparkle8twilight",
          "MYSQL_DATABASE":"logos",
          "MYSQL_HOST":"localhost"
        }
      }
  ]
}
