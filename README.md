# InnerStepsWebApp
Our AI-powered, anxiety support program provides families with a series of interactive picture/audio story adventures breaking down therapy into bite-sized lessons that help children build practical coping strategies, and confidence that suit their unique needs and reading level

MVP Build:

This MVP is designed to test how much personalisation is required to make the child feel like the story is for them. The most simplist way to test this is to procedurally generate the text of the story and then manually customise the images to match the child's profile description.

To Do:

1. Potentially update story design so that the img is full capacity and the text is overlayed in a box in 1 corner of the screen.

2. Look into open source lofi sleep sounds to play in the background of the story. 
        Should start as soon as app loads and continue playing through the story. 
        Add a simple button to pause/play the sound, and a volume slider to adjust the volume. 
        Include a simple notification which asks to turn on sound for the best experience.

3. Look into gamification elements such as game-like buttons and simple sounds (both in onboarding and app) 

5. Need to fix the practise mode... navigation buttons are broken and layout looks terrible.

Look into:

- PostHog for user analytics: https://posthog.com/talk-to-a-human
- ElevenLabs for audio generation: https://elevenlabs.io/
- Iconly for icons: https://iconly.io/

Current Stack:

- HTML
- CSS
- JavaScript
- Formspree
