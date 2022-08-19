# **Babylon-POC** <!-- omit in toc -->
*Current as of 8/17/2022*

- [Overview](#overview)
  - [Running the project](#running-the-project)
  - [Deploying the project](#deploying-the-project)
- [Current State](#current-state)
  - [TODO/Possible Future Improvements](#todopossible-future-improvements)
- [Libraries](#libraries)
- [Architecture](#architecture)
  - [Auth](#auth)
    - [Credentials](#credentials)
- [Known Issues](#known-issues)
- [Extensibility](#extensibility)

# Overview

This project started as a proof of concept for the viability of using Babylon JS to show sensor data in a 3D environment in the web using a scene composed of models of a bridge and the surrounding enviornment provided by Google Maps.

The project is a plain typescript project that uses webpack to compile and serve files. At the time of this writing there is no real sample data and any data currently showing is faked.

## Running the project

1. Install dependencies 
   > npm i
2. Run the project
   > npm run dev

The site is also currently deployed at <https://mcfarland-bridge.azurewebsites.net>. It is free tier and has a cold start.

## Deploying the project

The project is dockerized, and an image can be produced at any time. The current deployment setup is as follows: </br>
  1. Pushing to the `release` branch triggers a github action to notify a Docker Hub repo of an update
  2. Docker Hub pulls the project and builds an image
  3. Docker Hub uses a webhook to notify the Azure app service serving the image that a new image is available
  4. Azure app service pulls the new image and deploys it 

# Current State

There currently exists a scene with the bridge and models created, as well as some marker represention objects and heatmap/flexible surface experimental objects. 

Opening the side panel shows a list of markers that are selectible both in the menu and in the 3D environment to show their data over a time period. The markers are filterable, and there is a button to export a csv of sensor data.

There is also a slider with automatic playback to show a historical view of sensor data between selected start and end dates.

## TODO/Possible Future Improvements

  - Place sensors in actual positions when known
  - Get heatmap working with new sensor positions
  - Dyanmic surface (to show exaggerated sensor motion)
  
# Libraries

- msal-browser for auth
- fontawesome-free
- axios
- babylonjs
- babylonjs-gui
- abylonjs-loaders
- bootstrap 5
- d3 for graphs
- d3-brush
- earcu
- flatpickr
- lodash
- luxon
- sass

# Architecture

The site consists of a canvas that is the container for Babylon, and some overlay elements that are html and styled with scss.

The root of the project is `src/app.ts`, and all other classes, helpers, models, and style sheets are in `src` as well. All files in `public` are generated.

## Auth

Currently, users are stored in an Azure B2C Tenant, with a simple sign in flow using the Microsoft Authentication Library (msal-browser). For now this is a personal Azure subscription.

### Credentials 
> Username: dev </br> Password: P@ssw0rd!

# Known Issues

None as the project is still in a phase of testing and prototyping.

# Extensibility 

Static objects can be added to the scene and loaded from `environment.ts`

If the object is more complex and dynamic, I recommend making a separate class for it and adding it into the scene in the `_buildEnvironment` method of `app.ts`

