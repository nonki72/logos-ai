module.exports = {
  apps : [
      {
        name: "Logos",
        script: "./app.js",
        watch: true,
        env: {
          "GOOGLE_APPLICATION_CREDENTIALS":"/home/jordocote/.google/logos-162301-5257396ab743.json"
        }
      }
  ]
}
