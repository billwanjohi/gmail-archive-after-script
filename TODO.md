[![clasp](https://img.shields.io/badge/built%20with-clasp-4285f4.svg)](https://github.com/google/clasp)

## TODO

- [schedule intelligently](https://stackoverflow.com/questions/36108478/how-to-trigger-a-google-apps-script-once-an-email-get-in-the-inbox)
- [installable triggers](https://developers.google.com/apps-script/guides/triggers/installable)
- [gmail functions](https://developers.google.com/apps-script/reference/gmail/gmail-app)
- [sample gmail script](https://www.maketecheasier.com/google-scripts-to-automate-gmail/)


## Approach

- get all labels
- filter to relevant patterns
- for each more-recent
  - search for all threads in label + inbox
