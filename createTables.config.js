module.exports = {
  apps : [
      {
        name: "Logos CreateTables",
        script: "./createTables.js",
        watch: true,
        env: {
          "GOOGLE_APPLICATION_CREDENTIALS":"/home/jordocote/.google/logos-162301-5257396ab743.json",
          "MYSQL_USER":"logos",
          "MYSQL_PASSWORD":"sparkle8twilight",
          "MYSQL_DATABASE":"logos",
          "MYSQL_HOST":"localhost"
        }
      }
  ]
}
