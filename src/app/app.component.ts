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
    this.videoEl = this.video.nativeElement;
    this.canvas = this.overlay.nativeElement;

    this.run();
  }

  async run() {
    // load face detection and face expression recognition models: using 'tiny_face_detector'
    await faceapi.nets.tinyFaceDetector.load('assets/weights/');
    await faceapi.loadFaceExpressionModel('assets/weights/');

    // try to access users webcam and stream the images to the video element
    const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
    this.videoEl.srcObject = stream;
    this.videoEl.addEventListener('play', this.onPlay.bind(this));
  }

  public async onPlay() {
    const options = new faceapi.TinyFaceDetectorOptions({
      inputSize: 512,
      scoreThreshold: 0.5
    });

    const result = await faceapi
      .detectSingleFace(this.videoEl, options)
      .withFaceExpressions();

    // { detection: FaceDetection, expressions: 'neutral', 'angry', 'sad', 'surprised', 'happy', 'disgusted', 'fearful'}
    if (result) {
      const { width, height } = faceapi.getMediaDimensions(this.videoEl);
      this.canvas.width = width;
      this.canvas.height = height;

      // resize detections (and landmarks) in case displayed image is smaller than original size
      const resizedResults = faceapi.resizeResults([result], { width, height });

      faceapi.drawDetection(
        this.canvas,
        resizedResults.map((det: any) => det.detection),
        { withScore: false }
      );

      faceapi.drawFaceExpressions(
        this.canvas,
        resizedResults.map(({ detection, expressions }) => ({
          position: detection.box,
          expressions
        }))
      );
    }

    setTimeout(() => this.onPlay());
  }
}
