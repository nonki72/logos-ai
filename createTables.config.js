module.exports = {
  apps : [
      {
        name: "Logos CreateTables",
        script: "./createTables.js",
        watch: false,
        env: {
          "MYSQL_USER":"logos",
          "MYSQL_PASSWORD":"sparkle8twilight",
          "MYSQL_DATABASE":"logos",
          "MYSQL_HOST":"localhost"
        }
      }
  ]
}
