"use strict";

// some globalz:
let THREECAMERA = null;

// callback: launched if a face is detected or lost
function detect_callback(isDetected) {
  if (isDetected) {
    console.log('INFO in detect_callback(): DETECTED');
  } else {
    console.log('INFO in detect_callback(): LOST');
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

  // MT216: create the frame. We reuse the geometry of the video
  const fisrtOverlay = new THREE.Mesh(threeStuffs.videoMesh.geometry, create_mat2d(new THREE.TextureLoader().load('./images/screenBox.png'), true));
  fisrtOverlay.visible = false;
  threeStuffs.scene.add(fisrtOverlay);

  const secondOverlay = new THREE.Mesh(threeStuffs.videoMesh.geometry, create_mat2d(new THREE.TextureLoader().load('./images/screenBox2.png'), true));
  secondOverlay.visible = false;
  threeStuffs.scene.add(secondOverlay);

  // CREATE THE CAMERA:
  let camWidth = 100;
  let camHeight = 600;
  THREECAMERA = new THREE.OrthographicCamera(1, 1, 1, 1, 1, 1000);

  var toggleCaptureScreen = document.getElementById("closeBtn");
  toggleCaptureScreen.addEventListener('click', function () {
    console.log("TOGGLE");
    document.getElementById("capture").style.display = "none";
  }, false);

  var toggleButton1 = document.getElementById('toggleBtn1');
  toggleButton1.addEventListener('click', function () {
    fisrtOverlay.visible = !fisrtOverlay.visible;
  }, false);

  var toggleButton2 = document.getElementById('toggleBtn2');
  toggleButton2.addEventListener('click', function () {
    secondOverlay.visible = !secondOverlay.visible;
  }, false);
} // end init_threeScene()


function toggleVisibility() {
  // var overlayMesh = scene.getObjectByName("overlayMesh");
  console.log("TOGGLE");
  // overlayMesh.visible = !overlayMesh.visible;
  // overlayMesh.needsUpdate = true;
  // overlayMesh.updateMatrix();
}

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
        console.log('AN ERROR HAPPENS. SORRY BRO :( . ERR =', errCode);
        return;
      }

      console.log('INFO: JEEFACEFILTERAPI IS READY');
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
  var canvas = document.getElementById("jeeFaceFilterCanvas");
  var dataURL = canvas.toDataURL("image/png");
  document.getElementById("capture").src = dataURL;

  var downloader = document.getElementById("download");
  downloader.href = dataURL;
  document.getElementById("capture").style.display = "flex";
  window.parent.postMessage("Captured", "*")
}