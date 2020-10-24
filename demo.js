"use strict";

// some globalz:
let THREECAMERA = null;

// callback: launched if a face is detected or lost
function detect_callback(isDetected) {
  if (isDetected) {
    // console.log('INFO in detect_callback(): DETECTED');
  } else {
    // console.log('INFO in detect_callback(): LOST');
  }
}

// build the 3D. called once when Jeeliz Face Filter is OK:
function init_threeScene(spec) {
  const threeStuffs = THREE.JeelizHelper.init(spec, detect_callback);
  const loadingManager = new THREE.LoadingManager();

  // CREATE THE VIDEO BACKGROUND
  function create_mat2d(threeTexture, isTransparent) {
    return new THREE.RawShaderMaterial({
      depthWrite: false,
      depthTest: false,
      transparent: isTransparent,
      vertexShader: "attribute vec2 position;\n\
        varying vec2 vUV;\n\
        void main(void){\n\
          gl_Position = vec4(position, 0., 1.);\n\
          vUV = 0.5+0.5*position;\n\
        }",
      fragmentShader: "precision lowp float;\n\
        uniform sampler2D samplerVideo;\n\
        varying vec2 vUV;\n\
        void main(void){\n\
          gl_FragColor = texture2D(samplerVideo, vUV);\n\
        }",
      uniforms: {
        samplerVideo: { value: threeTexture }
      }
    });
  }

  //Create overlays. We reuse the geometry of the video
  const baseOverlay = new THREE.Mesh(threeStuffs.videoMesh.geometry, create_mat2d(new THREE.TextureLoader().load('./images/template1.png'), true));
  baseOverlay.visible = true;
  threeStuffs.scene.add(baseOverlay);

  const blueOverlay = new THREE.Mesh(threeStuffs.videoMesh.geometry, create_mat2d(new THREE.TextureLoader().load('./images/template3.png'), true));
  blueOverlay.visible = false;
  threeStuffs.scene.add(blueOverlay);

  const purpleOverlay = new THREE.Mesh(threeStuffs.videoMesh.geometry, create_mat2d(new THREE.TextureLoader().load('./images/template2.png'), true));
  purpleOverlay.visible = false;
  threeStuffs.scene.add(purpleOverlay);

  const ballOverlay = new THREE.Mesh(threeStuffs.videoMesh.geometry, create_mat2d(new THREE.TextureLoader().load('./images/ursoBola.png'), true));
  ballOverlay.visible = false;
  threeStuffs.scene.add(ballOverlay);

  const micOverlay = new THREE.Mesh(threeStuffs.videoMesh.geometry, create_mat2d(new THREE.TextureLoader().load('./images/ursoMic.png'), true));
  micOverlay.visible = false;
  threeStuffs.scene.add(micOverlay);

  // CREATE THE CAMERA:
  THREECAMERA = new THREE.OrthographicCamera(1, 1, 1, 1, 1, 1000);

  // Buttons State
  let galeryBtn = document.getElementById('galeryBtn');
  let closeBtn = document.getElementById('closeBtn');
  let captureBtn = document.getElementById('captureBtn');
  let downloadBtn = document.getElementById('downloadBtn');
  let faceBtn = document.getElementById('faceBtn');
  let toggleColor1 = document.getElementById('toggleColor1');
  let toggleColor2 = document.getElementById('toggleColor2');
  let toggleColor3 = document.getElementById('toggleColor3');
  let toggleButton1 = document.getElementById('toggleBtn1');
  let toggleButton2 = document.getElementById('toggleBtn2');
  let coresDiv = document.getElementById('coresDiv');
  let ursosDiv = document.getElementById('ursosDiv');
  let loadingCard = document.getElementById('loading');
  let callToAction = document.getElementById('cta');

  callToAction.style.display = 'none'
  loadingCard.style.display = 'none';

  coresDiv.style.visibility = 'visible';
  ursosDiv.style.visibility = 'hidden';

  galeryBtn.style.display = 'none';
  closeBtn.style.display = 'none';
  downloadBtn.style.display = 'none';
  faceBtn.style.display = 'none';
  captureBtn.style.display = 'flex';

  closeBtn.addEventListener('click', function () {
    document.getElementById("capture").style.display = "none";

    galeryBtn.style.display = 'none';
    closeBtn.style.display = 'none';
    downloadBtn.style.display = 'none';
    faceBtn.style.display = 'none';
    captureBtn.style.display = 'flex';

    coresDiv.style.visibility = 'visible';
    ursosDiv.style.visibility = 'hidden';

    baseOverlay.visible = true;
    blueOverlay.visible = false;
    purpleOverlay.visible = false;
    micOverlay.visible = false;
    ballOverlay.visible = false;

  }, false);

  toggleColor1.addEventListener('click', function () {
    baseOverlay.visible = true;
    blueOverlay.visible = false;
    purpleOverlay.visible = false;
    micOverlay.visible = false;
    ballOverlay.visible = false;

    ursosDiv.style.visibility = 'hidden';

  }, false);

  toggleColor2.addEventListener('click', function () {
    baseOverlay.visible = false;
    blueOverlay.visible = true;
    purpleOverlay.visible = false;

    ursosDiv.style.visibility = 'visible';

  }, false);

  toggleColor3.addEventListener('click', function () {
    baseOverlay.visible = false;
    blueOverlay.visible = false;
    purpleOverlay.visible = true;

    ursosDiv.style.visibility = 'visible';

  }, false);

  toggleButton1.addEventListener('click', function () {
    ballOverlay.visible = !ballOverlay.visible;
    micOverlay.visible = false;
    baseOverlay.visible = false;
    // if (!ballOverlay.visible && !micOverlay.visible) { baseOverlay.visible = true }

  }, false);

  toggleButton2.addEventListener('click', function () {
    ballOverlay.visible = false;
    micOverlay.visible = !micOverlay.visible;
    baseOverlay.visible = false;
    // if (!ballOverlay.visible && !micOverlay.visible) { baseOverlay.visible = true };
  }, false);


} // end init_threeScene()

// Entry point, launched by body.onload():
function main() {
  JeelizResizer.size_canvas({
    canvasId: 'jeeFaceFilterCanvas',
    callback: function (isError, bestVideoSettings) {
      init_faceFilter(bestVideoSettings);
    }
  })
}

function init_faceFilter(videoSettings) {
  JEEFACEFILTERAPI.init({
    canvasId: 'jeeFaceFilterCanvas',
    NNCpath: '../../../dist/', // root of NNC.json file
    videoSettings: videoSettings,
    callbackReady: function (errCode, spec) {

      if (errCode) {
        let cameraText = document.getElementById('cameraText');
        // cameraText.style.display = 'none';
        cameraText.innerHTML = 'Câmera indisponível 😔';
        // cameraText.innerHTML = 'Câmera indisponível'

        console.log('AN ERROR HAPPENED. SORRY :( . ERR =', errCode);
        return;
      }

      // console.log('INFO: JEEFACEFILTERAPI IS READY');
      init_threeScene(spec);
    },

    // called at each render iteration (drawing loop)
    callbackTrack: function (detectState) {
      THREE.JeelizHelper.render(detectState, THREECAMERA);
    }
  }); // end JEEFACEFILTERAPI.init call
}

// Capture canvas and download
function capture() {
  // LOAD CLICK SOUND
  let clickSound = new Audio('./sounds/camera-shutter-click.mp3');
  clickSound.volume = 0.9;
  clickSound.play();

  galeryBtn.style.display = 'flex';
  closeBtn.style.display = 'flex';
  downloadBtn.style.display = 'flex';
  faceBtn.style.display = 'none';
  captureBtn.style.display = 'none';

  let coresDiv = document.getElementById('coresDiv');
  let ursosDiv = document.getElementById('ursosDiv');
  coresDiv.style.visibility = 'hidden';
  ursosDiv.style.visibility = 'hidden';

  var canvas = document.getElementById("jeeFaceFilterCanvas");
  var dataURL = canvas.toDataURL("image/png");

  var captureImage = document.getElementById("capture");
  captureImage.src = dataURL;
  document.getElementById("capture").style.display = "flex";

  drawSecondCanvas();
}

function drawSecondCanvas() {
  const inputImage = document.querySelector('.capture');

  // need to check if the image has already loaded
  if (inputImage.complete) {
    flipImage();
  }
  // if not, we wait for the onload callback to fire
  else {
    inputImage.onload = flipImage;
  }

  // this function will flip the imagedata
  function flipImage() {

    // create a canvas that will present the output image
    const outputImage = document.createElement('canvas');

    // set it to the same size as the image
    outputImage.width = inputImage.naturalWidth;
    outputImage.height = inputImage.naturalHeight;

    // get the drawing context, needed to draw the new image
    const ctx = outputImage.getContext('2d');

    // scale the drawing context negatively to the left (our image is 400 pixels wide)
    // resulting change to context: 0 to 400 -> -400 to 0
    ctx.scale(-1, 1);

    // draw our image at position [-width, 0] on the canvas, we need 
    // a negative offset because of the negative scale transform
    ctx.drawImage(inputImage, -outputImage.width, 0);

    // insert the output image after the input image
    // inputImage.parentNode.insertBefore(outputImage, inputImage.nextElementSibling);

    let showScreen = document.getElementById('show-image');
    showScreen.src = outputImage.toDataURL();

    let downloader = document.getElementById("download");
    downloader.href = outputImage.toDataURL();
  }
}

function sendToGalery() {
  console.log("send to galery");
  let downloader = document.getElementById("download");
  let msg = JSON.stringify(downloader.href)
  window.parent.postMessage(msg, '*');
}

function sendToFacebook() {
  let downloader = document.getElementById("download");
  let msg = JSON.stringify({ 'sender': 'facebook', 'uri': downloader.href })
  window.parent.postMessage(msg, '*');
}


