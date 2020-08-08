export default class Pipe {
  constructor(streamIn, streamOut) {
    this.streamIn = streamIn;
    this.streamOut = streamOut;
  }

  init() {
    const { streamIn, streamOut } = this;
    
    streamIn
      .on('data', function (chunk) {
        // data += chunk.length;
        streamOut.write(chunk);
      })
      .on('end', function () {
        streamOut.end(); // End the response when the stream ends
      });
  }
}