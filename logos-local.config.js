module.exports = {
  apps : [
      {
        name: "Logos local",
        script: "./app.js",
        watch: true,
        autorestart : true,
        env: {
          "GCLOUD_PROJECT": "logos-162301",
          "CLOUD_BUCKET": "logos-162301",
          "DATASTORE_DATASET":"logos-162301",
          "DATASTORE_EMULATOR_HOST_PATH":"localhost:8081/datastore",
          "DATASTORE_EMULATOR_HOST":"localhost:8081",
          "DATASTORE_HOST":"http://localhost:8081",
          "DATASTORE_PROJECT_ID":"logos-162301",
          "MYSQL_USER":"logos",
          "MYSQL_PASSWORD":"sparkle8twilight",
          "MYSQL_DATABASE":"logos",
          "MYSQL_HOST":"localhost"
        }
      }
  ]
}
