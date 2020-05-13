module.exports = {
  apps : [
      {
        name: "App engine server",
        script: "/usr/lib/google-cloud-sdk/bin/dev_appserver.py --support_datastore_emulator=true --enable_console=true app.yaml",
        watch: false,
        autorestart : true,
        env: {
          "GOOGLE_APPLICATION_CREDENTIALS":"~/.google/logos-162301-5257396ab743.json",
          "GCLOUD_PROJECT": "logos-162301",
          "CLOUD_BUCKET": "logos-162301",
        }
      }
  ]
}
