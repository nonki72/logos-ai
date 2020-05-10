module.exports = {
  apps : [
      {
        name: "Logos test",
        script: "npm -- test",
        watch: true,
        autorestart : false,
        env: {
          "GOOGLE_APPLICATION_CREDENTIALS":"/home/jordocote/.google/logos-162301-5257396ab743.json",
          "GCLOUD_PROJECT": "logos",
          "CLOUD_BUCKET": "logos",
          "MYSQL_USER":"logos",
          "MYSQL_PASSWORD":"sparkle8twilight",
          "MYSQL_DATABASE":"logos",
          "MYSQL_HOST":"localhost"
        }
      }
  ]
}
