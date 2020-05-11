module.exports = {
  apps : [
      {
        name: "Datastore emulator",
        script: "gcloud beta emulators datastore start",
        watch: false,
        autorestart : true,
        env: {
          "GOOGLE_APPLICATION_CREDENTIALS":"/home/jordocote/.google/logos-162301-5257396ab743.json",
          "GCLOUD_PROJECT": "logos-162301",
          "CLOUD_BUCKET": "logos-162301",
        }
      }
  ]
}
