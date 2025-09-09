
### Prompt (Improved)

Now you are integrating the sales API.

We are start to the **Start Screen** of a PoS interface. Follow these rules carefully:

1. **Visual Settings**

   * Fetch configuration from:

     ```
     curl --location 'http://localhost:8090/interface/visual_settings'
     ```
   * Example response:

     ```json
     [
       {
         "background_color": "",
         "background_image": "/media/customer/",
         "font_color": "",
         "logotype_image": "/media/customer/",
         "logotype_pos_x": "",
         "logotype_pos_y": ""
       },
       {
         "timestamp": "2025-09-06T10:18:11.439"
       }
     ]
     ```
   * Rules:

     * Use **default values** if `background_color`, `background_image`, or `font_color` are empty from reference docs/01_initial_screen.md
     * Ignore `logotype_pos_x` and `logotype_pos_y`.
     * Display the **logotype** if `logotype_image` is available.

2. **Digital Signage (Media Playback)**

   * Fetch data from:

     ```
     curl --location 'http://localhost:8090/interface/digital_signage'
     ```
   * Example response:

     ```json
     [
       {
         "id": 11,
         "interval": {
           "beginning": "2025-09-01",
           "ending": "2025-09-30"
         },
         "media": {
           "filename": "simplescreenrecorder-2024-10-23_09.25.29.mp4",
           "pending": 0,
           "source": "/media/videos/simplescreenrecorder-2024-10-23_09.25.29.mp4",
           "url": "https://imach.s3.amazonaws.com/core-web-application/videos/simplescreenrecorder-2024-10-23_09.25.29.mp4"
         },
         "title": "Propaganda teste"
       },
       {
         "timestamp": "2025-09-06T10:16:59.769"
       }
     ]
     ```
   * Rules:

     * If **one or more videos** are available and valid for the current date (`interval`), play them in **full screen**.
     * If multiple videos exist, play them **sequentially**.
     * If the user **clicks/taps the video**, immediately redirect to the **Products Screen**.
     * Re-check the **digital\_signage** and **visual\_settings** endpoints every **15 minutes**.

3. **Session Management**

   * If the page is redirected (e.g., user goes to Products Screen), call the session endpoint:

     ```
     curl --location 'http://localhost:8090/interface/session' \
     --data ''
     ```
   * After finishing session initialization, wait for instructions from the Products Screen.



