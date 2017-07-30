# Clone of [R2D3](http://www.r2d3.us) decision tree

[See Demo](https://yamad.github.io/r2d3-decision-tree/) (press spacebar to start/stop, enter to reset)

There is a beautiful animation of data flowing through a decision tree at [R2D3: A Visual Guide to Machine Learning](http://www.r2d3.us). This is a clone to learn about how that animation was made.

Made with: [React](https://facebook.github.io/react), [D3](https://d3js.org), and [React-Motion](https://github.com/chenglou/react-motion) (as an exercise).

## Build

This project uses `npm` scripts as a build tool. See the `scripts` section of `package.json` for a full list of available build tasks.

To make a production build, issue these commands from the source directory,

    npm install
    npm run build

Start a development server with

    npm run open-src

This opens a page that hot-loads any source file changes so they are immediately visible. Note that performance of the development builds is worse than the production build.

The build was bootstrapped with [react-slingshot](https://github.com/coryhouse/react-slingshot).
