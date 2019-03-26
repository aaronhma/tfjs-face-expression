import { Component, OnInit, ViewChild } from '@angular/core';

import * as faceapi from 'face-api.js';

@Component({
  selector: 'app-root',
  template: `
    <header>
      <img src="https://aaronhma.github.io/tfjs-face-expression/assets/images/logo.png" alt="Tensorflow.js" />
    </header>
    <div class="container">
      <div>
        <video #inputVideo autoplay muted></video>
        <canvas #overlay></canvas>
      </div>
    </div>
    <footer>
      <a href="https://github.com/justadudewhohacks/face-api.js" target="_blank"
        >Built with <strong>face-api.js</strong></a
      >
    </footer>
  `,
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  @ViewChild('inputVideo') video: any;
  @ViewChild('overlay') overlay: any;

  public videoEl: HTMLVideoElement;
  public canvas: any;

  ngOnInit() {
    // access video and canvas HTML DOM element
    this.videoEl = this.video.nativeElement;
    this.canvas = this.overlay.nativeElement;

    this.run();
  }

  async run() {
    // load face detection and face expression recognition model named 'tiny_face_detector'
    await faceapi.nets.tinyFaceDetector.load('assets/weights/');
    await faceapi.loadFaceExpressionModel('assets/weights/');

    // try to access users webcam and stream the images to the video element
    const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
    this.videoEl.srcObject = stream;
    // add event listener callback for manipulating webcam streaming data
    this.videoEl.addEventListener('play', this.onPlay.bind(this));
  }

  // manipulating webcam streaming data
  public async onPlay() {
    // Specify the face detector default options
    const options = new faceapi.TinyFaceDetectorOptions({
      // size at which image is processed
      inputSize: 512,
      // minimum confidence threshold: only show successful inference above 50%
      scoreThreshold: 0.5
    });

    // detect the face with the highest confidence score in an image that coming from webcam
    // `withFaceExpressions`: Face expression recognition is performed for detected face
    const result = await faceapi
      .detectSingleFace(this.videoEl, options)
      .withFaceExpressions();

    // result: { detection: FaceDetection, expressions: 'neutral', 'angry', 'sad', 'surprised', 'happy', 'disgusted', 'fearful'}
    if (result) {
      // retrieve the detected face dimension
      const { width, height } = faceapi.getMediaDimensions(this.videoEl);
      // create a bounding box in canvas element overlayed on top of video element
      this.canvas.width = width;
      this.canvas.height = height;

      // resize detections in case displayed image has a different size then the original
      const resizedResults = faceapi.resizeResults([result], { width, height });

      // the function to draw face detection into a canvas
      faceapi.drawDetection(
        this.canvas,
        resizedResults.map((det: any) => det.detection),
        { withScore: false }
      );

      // the function to draw face expression recognition into a canvas
      faceapi.drawFaceExpressions(
        this.canvas,
        resizedResults.map(({ detection, expressions }) => ({
          position: detection.box,
          expressions
        }))
      );
    }

    // repeatedly perform the face detection while webcam stream the image data
    setTimeout(() => this.onPlay());
  }
}
