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
  const baseOverlay = new THREE.Mesh(threeStuffs.videoMesh.geometry, create_mat2d(new THREE.TextureLoader().load('./images/template_foto_1.png'), true));
  baseOverlay.visible = true;
  threeStuffs.scene.add(baseOverlay);

  const fisrtOverlay = new THREE.Mesh(threeStuffs.videoMesh.geometry, create_mat2d(new THREE.TextureLoader().load('./images/template_foto_2.png'), true));
  fisrtOverlay.visible = false;
  threeStuffs.scene.add(fisrtOverlay);

  const secondOverlay = new THREE.Mesh(threeStuffs.videoMesh.geometry, create_mat2d(new THREE.TextureLoader().load('./images/template_foto_3.png'), true));
  secondOverlay.visible = false;
  threeStuffs.scene.add(secondOverlay);

  // CREATE THE CAMERA:
  THREECAMERA = new THREE.OrthographicCamera(1, 1, 1, 1, 1, 1000);


  // Buttons State

  let galeryBtn = document.getElementById('galeryBtn');
  let closeBtn = document.getElementById('closeBtn');
  let captureBtn = document.getElementById('captureBtn');
  let downloadBtn = document.getElementById('downloadBtn');
  let faceBtn = document.getElementById('faceBtn');

  galeryBtn.style.display = 'none';
  closeBtn.style.display = 'none';
  downloadBtn.style.display = 'none';
  faceBtn.style.display = 'none';
  captureBtn.style.display = 'flex';


  let toggleCaptureScreen = document.getElementById("closeBtn");
  toggleCaptureScreen.addEventListener('click', function () {
    document.getElementById("capture").style.display = "none";

    galeryBtn.style.display = 'none';
    closeBtn.style.display = 'none';
    downloadBtn.style.display = 'none';
    faceBtn.style.display = 'none';
    captureBtn.style.display = 'flex';

  }, false);

  let toggleButton1 = document.getElementById('toggleBtn1');
  toggleButton1.addEventListener('click', function () {
    fisrtOverlay.visible = !fisrtOverlay.visible;
    secondOverlay.visible = false;
    baseOverlay.visible = false;
    if (!fisrtOverlay.visible && !secondOverlay.visible) { baseOverlay.visible = true }

  }, false);

  let toggleButton2 = document.getElementById('toggleBtn2');
  toggleButton2.addEventListener('click', function () {
    fisrtOverlay.visible = false;
    secondOverlay.visible = !secondOverlay.visible;
    baseOverlay.visible = false;
    if (!fisrtOverlay.visible && !secondOverlay.visible) { baseOverlay.visible = true };
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
        console.log('AN ERROR HAPPENS. SORRY :( . ERR =', errCode);
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

  galeryBtn.style.display = 'flex';
  closeBtn.style.display = 'flex';
  downloadBtn.style.display = 'flex';
  faceBtn.style.display = 'flex';
  captureBtn.style.display = 'none';

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

// function download() {
//   let downloader = document.getElementById("download");

// }

function sendToGalery() {
  console.log("send to galery");
  window.parent.postMessage('sendToGalery', '*');
}

function convertURIToImageData(URI) {
  return new Promise(function (resolve, reject) {
    if (URI == null) return reject();
    let canvas = document.createElement('canvas'),
      context = canvas.getContext('2d'),
      image = new Image();
    image.addEventListener(
      'load',
      function () {
        canvas.width = image.width;
        canvas.height = image.height;
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(context.getImageData(0, 0, canvas.width, canvas.height));
        let imageFile = canvas.toDataURL('image/png').slice(22);
        console.log('imageFile: ')

      },
      false,
    );
    image.src = URI;
  });
}
