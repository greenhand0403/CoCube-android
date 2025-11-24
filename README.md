## CoCube Android App for Tablet

This app was created using [`@capacitor/create-app`](https://github.com/ionic-team/create-capacitor-app),  
and comes with a very minimal shell for building an app.

### License and Attribution

This project is based on the following repositories:

1. [SmallVM by John Maloney](https://bitbucket.org/john_maloney/smallvm)  
2. [SmallVM by MicroBlocksCN](https://github.com/MicroBlocksCN/smallvm)  
3. [MicroBlocks App by MicroBlocksCN](https://github.com/MicroBlocksCN/microblocks-app)  

These repositories are licensed under the [Mozilla Public License 2.0 (MPL-2.0)](https://www.mozilla.org/en-US/MPL/2.0/).  
In accordance with the MPL-2.0 license, this project retains the same license.  

### Building the App

1. Copy the webapp output to the `src` folder.
2. Apply the patch `gpsupport.diff` to `gpSupport.js`:
   ```bash
   patch src/gpSupport.js < gpsupport.diff
   ```
3. Run the following commands to build and sync the app:
   ```bash
   npm run build
   npx cap sync
   ```
4. Open the app in the desired platform:
   - For iOS:
     ```bash
     npx cap open ios
     ```
   - For Android:
     ```bash
     npx cap open android
     ```

### Notes

- Ensure you have all dependencies installed as specified in `package.json`.
- Refer to the [Capacitor documentation](https://capacitorjs.com/docs) for additional setup and configuration details.